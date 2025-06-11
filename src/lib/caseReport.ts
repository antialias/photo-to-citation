import path from "node:path";
import { z } from "zod";
import type { Case } from "./caseStore";
import { openai } from "./openai";
import type { ReportModule } from "./reportModules";

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

  const res = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: "You create email drafts for municipal authorities.",
      },
      { role: "user", content: prompt },
    ],
    max_tokens: 300,
    response_format: { type: "json_object" },
  });

  const text = res.choices[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(text);
  return emailDraftSchema.parse(parsed);
}
