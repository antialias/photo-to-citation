import path from "node:path";
import { z } from "zod";
import type { Case } from "./caseStore";
import { openai } from "./openai";
import type { ReportModule } from "./reportModules";

function logBadResponse(
  attempt: number,
  response: string,
  error: unknown,
): void {
  const entry = {
    timestamp: new Date().toISOString(),
    attempt: attempt + 1,
    error: String(error),
    response,
  };
  console.warn(JSON.stringify(entry));
}

export const emailDraftSchema = z.object({
  subject: z.string(),
  body: z.string(),
});

export type EmailDraft = z.infer<typeof emailDraftSchema>;

export async function draftEmail(
  caseData: Case,
  mod: ReportModule,
): Promise<EmailDraft> {
  const analysis = caseData.analysis;
  const vehicle = analysis?.vehicle ?? {};
  let time = caseData.createdAt;
  if (analysis?.images) {
    const best = Object.entries(analysis.images).sort(
      (a, b) => b[1].representationScore - a[1].representationScore,
    )[0];
    if (best) {
      const file = caseData.photos.find((p) => path.basename(p) === best[0]);
      if (file) {
        const t = caseData.photoTimes[file];
        if (t) time = t;
      }
    }
  }
  const location =
    caseData.streetAddress ||
    caseData.intersection ||
    (caseData.gps
      ? `${caseData.gps.lat}, ${caseData.gps.lon}`
      : "unknown location");
  const schema = {
    type: "object",
    properties: { subject: { type: "string" }, body: { type: "string" } },
  };
  const prompt = `Draft a short, professional email to ${mod.authorityName} reporting a vehicle violation.
Include these details if available:
- Violation: ${analysis?.violationType || ""}
- Description: ${analysis?.details || ""}
- Location: ${location}
- License Plate: ${vehicle.licensePlateState || ""} ${vehicle.licensePlateNumber || ""}
 - Time: ${new Date(time).toLocaleString()}
Mention that photos are attached. Respond with JSON matching this schema: ${JSON.stringify(
    schema,
  )}`;

  const baseMessages = [
    {
      role: "system",
      content: "You create email drafts for municipal authorities.",
    },
    { role: "user", content: prompt },
  ];

  const messages = [...baseMessages];
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      max_tokens: 300,
      response_format: { type: "json_object" },
    });
    const text = res.choices[0]?.message?.content ?? "{}";
    try {
      const parsed = JSON.parse(text);
      return emailDraftSchema.parse(parsed);
    } catch (err) {
      logBadResponse(attempt, text, err);
      if (attempt === 2) return { subject: "", body: "" };
      messages.push({ role: "assistant", content: text });
      messages.push({
        role: "user",
        content: `The previous JSON did not match the schema: ${err}. Please reply with corrected JSON only.`,
      });
    }
  }
  return { subject: "", body: "" };
}

export async function draftFollowUp(
  caseData: Case,
  mod: ReportModule,
): Promise<EmailDraft> {
  const history = (caseData.sentEmails ?? []).map((m) => ({
    role: "assistant",
    content: `Subject: ${m.subject}\n\n${m.body}`,
  }));
  const analysis = caseData.analysis;
  const vehicle = analysis?.vehicle ?? {};
  const location =
    caseData.streetAddress ||
    caseData.intersection ||
    (caseData.gps
      ? `${caseData.gps.lat}, ${caseData.gps.lon}`
      : "unknown location");
  const schema = {
    type: "object",
    properties: { subject: { type: "string" }, body: { type: "string" } },
  };
  const prompt = `Write a brief follow-up email to ${mod.authorityName} about the previous report.
Include these details if available:
- Violation: ${analysis?.violationType || ""}
- Description: ${analysis?.details || ""}
- Location: ${location}
- License Plate: ${vehicle.licensePlateState || ""} ${vehicle.licensePlateNumber || ""}
Mention that photos are attached again. Respond with JSON matching this schema: ${JSON.stringify(
    schema,
  )}`;
  const baseMessages = [
    {
      role: "system",
      content: "You create email drafts for municipal authorities.",
    },
    ...history,
    { role: "user", content: prompt },
  ];

  const messages = [...baseMessages];
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      max_tokens: 300,
      response_format: { type: "json_object" },
    });
    const text = res.choices[0]?.message?.content ?? "{}";
    try {
      const parsed = JSON.parse(text);
      return emailDraftSchema.parse(parsed);
    } catch (err) {
      logBadResponse(attempt, text, err);
      if (attempt === 2) return { subject: "", body: "" };
      messages.push({ role: "assistant", content: text });
      messages.push({
        role: "user",
        content: `The previous JSON did not match the schema: ${err}. Please reply with corrected JSON only.`,
      });
    }
  }
  return { subject: "", body: "" };
}
