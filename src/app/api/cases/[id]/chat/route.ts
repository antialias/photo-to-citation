import { caseChatReplySchema } from "@/generated/zod/caseChat";
import { withCaseAuthorization } from "@/lib/authz";
import { getCaseActionStatus } from "@/lib/caseActions";
import { getCase } from "@/lib/caseStore";
import { getLlm } from "@/lib/llm";
import { chatWithSchema } from "@/lib/llmUtils";
import { getLocalizedText, normalizeLocalizedText } from "@/lib/localizedText";
import { NextResponse } from "next/server";
import { APIError } from "openai/error";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

export const POST = withCaseAuthorization(
  { obj: "cases", act: "read" },
  async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    const body = (await req.json()) as {
      messages: Array<{ role: "user" | "assistant"; content: string }>;
      lang?: string;
    };
    const userLang = body.lang ?? "en";
    const c = getCase(id);
    if (!c) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const analysis = c.analysis;
    const vehicle = analysis?.vehicle ?? {};
    const location =
      c.streetAddress ||
      c.intersection ||
      (c.gps ? `${c.gps.lat}, ${c.gps.lon}` : "unknown location");
    const contextLines = analysis?.images
      ? Object.entries(analysis.images)
          .map(([name, info]) => {
            const ctx = getLocalizedText(info.context, userLang).text;
            return `Photo ${name}: ${ctx}`;
          })
          .join("\n")
      : "";
    const statuses = getCaseActionStatus(c);
    const available = statuses.filter((s) => s.applicable);
    const unavailable = statuses.filter((s) => !s.applicable);
    const actionList = available
      .map((a) => `- ${a.label} (id: ${a.id}) - ${a.description}`)
      .join("\\n");
    const unavailableList = unavailable
      .map(
        (a) =>
          `- ${a.label} (id: ${a.id}) - ${a.description} (not applicable: ${a.reason})`,
      )
      .join("\\n");
    const schemaDesc =
      "{ response: string, actions: [{ id?: string, field?: string, value?: string, photo?: string, note?: string }], noop: boolean }";
    const system = [
      "You are a helpful legal assistant for the Photo To Citation app.",
      "The user is asking about a case with these details:",
      `Violation: ${analysis?.violationType || ""}`,
      `Description: ${analysis ? getLocalizedText(analysis.details, userLang).text : ""}`,
      `Location: ${location}`,
      `License Plate: ${vehicle.licensePlateState || ""} ${vehicle.licensePlateNumber || ""}`,
      `Number of photos: ${c.photos.length}.`,
      contextLines ? `Image contexts:\n${contextLines}` : "",
      "When there is no user question yet, decide if you should proactively suggest a next action or useful observation.",
      "Only set response to [noop] if you truly have nothing helpful to add after careful consideration. Otherwise include at least a brief reply.",
      `Reply in JSON matching this schema: ${schemaDesc}`,
      "Use {id: ID} objects for case actions.",
      "Use {field: FIELD, value: VALUE} to edit the case (fields: vin, plate, state, note).",
      "Use {photo: FILENAME, note: NOTE} to append a note to a photo.",
      `User language: ${userLang}. Reply in this language and include it as "lang" in your JSON.`,
      available.length > 0 ? `Available actions:\n${actionList}` : "",
      unavailable.length > 0
        ? `Unavailable actions (not applicable):\n${unavailableList}`
        : "",
    ]
      .filter(Boolean)
      .join("\n");

    const messages: ChatCompletionMessageParam[] = [
      { role: "system", content: system },
      ...body.messages,
    ];

    const { client, model } = getLlm("draft_email");
    try {
      const raw = await chatWithSchema(
        client,
        model,
        messages,
        caseChatReplySchema,
        {
          maxTokens: 800,
        },
      );
      const lang =
        (raw as { language?: string; lang?: string }).lang ??
        (raw as { language?: string }).language ??
        "en";
      const reply: import("@/lib/caseChat").CaseChatReply = {
        response: normalizeLocalizedText(raw.response, lang),
        actions: raw.actions,
        noop: raw.noop,
        lang,
      };
      return NextResponse.json({
        reply,
        system,
        available: available.map((a) => a.id),
        unavailable: unavailable.map((a) => a.id),
      });
    } catch (err) {
      if (
        err instanceof Error &&
        ["parse", "schema", "truncated"].includes(err.message)
      ) {
        return NextResponse.json({ error: err.message }, { status: 502 });
      }
      const status = err instanceof APIError ? err.status : 503;
      return NextResponse.json({ error: "server_error" }, { status });
    }
  },
);
