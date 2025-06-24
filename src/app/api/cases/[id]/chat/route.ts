import { caseChatReplySchema } from "@/generated/zod/caseChat";
import { withCaseAuthorization } from "@/lib/authz";
import { caseActions } from "@/lib/caseActions";
import { getCase } from "@/lib/caseStore";
import { getCaseOwnerContactInfo } from "@/lib/caseUtils";
import { getLlm } from "@/lib/llm";
import { chatWithSchema } from "@/lib/llmUtils";
import { reportModules } from "@/lib/reportModules";
import { NextResponse } from "next/server";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

function actionCompleted(
  c: import("@/lib/caseStore").Case,
  id: string,
): boolean {
  const authority = reportModules["oak-park"].authorityEmail;
  switch (id) {
    case "compose":
      return (c.sentEmails ?? []).some((e) => e.to === authority);
    case "followup":
      return (c.sentEmails ?? []).some((e) => e.to === authority && e.replyTo);
    case "notify-owner": {
      const owner = getCaseOwnerContactInfo(c)?.email;
      return owner ? (c.sentEmails ?? []).some((e) => e.to === owner) : false;
    }
    case "ownership":
      return (c.ownershipRequests ?? []).length > 0;
    default:
      return false;
  }
}

export const POST = withCaseAuthorization(
  { obj: "cases", act: "read" },
  async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    const body = (await req.json()) as {
      messages: Array<{ role: "user" | "assistant"; content: string }>;
    };
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
          .map(([name, info]) => `Photo ${name}: ${info.context || ""}`)
          .join("\n")
      : "";
    const available = caseActions.filter((a) => !actionCompleted(c, a.id));
    const actionList = available
      .map((a) => `- ${a.label} (id: ${a.id}) - ${a.description}`)
      .join("\\n");
    const schemaDesc =
      "{ response: string, actions: [{ id?: string, field?: string, value?: string, photo?: string, note?: string }], noop: boolean }";
    const system = [
      "You are a helpful legal assistant for the Photo To Citation app.",
      "The user is asking about a case with these details:",
      `Violation: ${analysis?.violationType || ""}`,
      `Description: ${analysis?.details || ""}`,
      `Location: ${location}`,
      `License Plate: ${vehicle.licensePlateState || ""} ${vehicle.licensePlateNumber || ""}`,
      `Number of photos: ${c.photos.length}.`,
      contextLines ? `Image contexts:\n${contextLines}` : "",
      "When there is no user question yet, decide if you should proactively suggest a next action or useful observation.",
      "If you have nothing helpful, set response to [noop].",
      `Reply in JSON matching this schema: ${schemaDesc}`,
      available.length > 0 ? `Available actions:\n${actionList}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const messages: ChatCompletionMessageParam[] = [
      { role: "system", content: system },
      ...body.messages,
    ];

    const { client, model } = getLlm("draft_email");
    const reply = await chatWithSchema(
      client,
      model,
      messages,
      caseChatReplySchema,
      {
        maxTokens: 800,
      },
    );
    return NextResponse.json({ reply });
  },
);
