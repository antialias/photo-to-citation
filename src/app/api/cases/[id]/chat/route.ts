import { withCaseAuthorization } from "@/lib/authz";
import { caseActions } from "@/lib/caseActions";
import { getCase } from "@/lib/caseStore";
import { getCaseOwnerContactInfo } from "@/lib/caseUtils";
import { getLlm } from "@/lib/llm";
import { reportModules } from "@/lib/reportModules";
import { NextResponse } from "next/server";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

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

    const done = new Set<string>();
    const emails = c.sentEmails ?? [];
    const reportModule = reportModules["oak-park"];
    const authorityEmail = reportModule.authorityEmail;
    const authEmails = emails.filter((m) => m.to === authorityEmail);
    if (authEmails.length > 0) {
      done.add("compose");
      const last = authEmails[authEmails.length - 1];
      const recentCutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
      if (
        new Date(last.sentAt).getTime() > recentCutoff ||
        authEmails.length > 1
      ) {
        done.add("followup");
      }
    }
    const ownerInfo = getCaseOwnerContactInfo(c);
    if (ownerInfo?.email) {
      if (emails.some((m) => m.to === ownerInfo.email)) {
        done.add("notify-owner");
      }
    }
    if (c.ownershipRequests && c.ownershipRequests.length > 0) {
      done.add("ownership");
    }

    const availableActions = caseActions.filter((a) => !done.has(a.id));
    const actionList = availableActions
      .map((a) => `- ${a.label} [${a.id}]: ${a.description}`)
      .join("\\n");
    const doneList = caseActions
      .filter((a) => done.has(a.id))
      .map((a) => a.label)
      .join(", ");
    const system = [
      "You are a helpful legal assistant for the Photo To Citation app.",
      "The user is asking about a case with these details:",
      `Violation: ${analysis?.violationType || ""}`,
      `Description: ${analysis?.details || ""}`,
      `Location: ${location}`,
      `License Plate: ${vehicle.licensePlateState || ""} ${vehicle.licensePlateNumber || ""}`,
      `Number of photos: ${c.photos.length}.`,
      contextLines ? `Image contexts:\n${contextLines}` : "",
      doneList ? `Completed actions: ${doneList}.` : "",
      "When there is no user question yet, decide if you should proactively suggest a next action or useful observation.",
      "If you have nothing helpful, reply with [noop].",
      "To include an action button, insert a token like [action:compose] in your reply.",
      "Write the token exactly with no spaces or label text inside.",
      "For example:",
      "You may want to notify the vehicle owner. [action:notify-owner]",
      "The UI will replace the token with a button.",
      "You can also suggest edits with [edit:FIELD=VALUE] tokens (fields: vin, plate, state, note).",
      `Available actions:\n${actionList}`,
    ]
      .filter(Boolean)
      .join("\n");

    const messages: ChatCompletionMessageParam[] = [
      { role: "system", content: system },
      ...body.messages,
    ];

    const { client, model } = getLlm("draft_email");
    const res = await client.chat.completions.create({
      model,
      messages,
      max_tokens: 800,
    });
    const reply = res.choices[0]?.message?.content ?? "";
    return NextResponse.json({ reply });
  },
);
