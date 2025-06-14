import path from "node:path";
import { z } from "zod";
import "./zod-setup";
import type { Case, SentEmail } from "./caseStore";
import { getCaseOwnerContactInfo } from "./caseUtils";
import { getLlm } from "./llm";
import type { ReportModule } from "./reportModules";
import { getViolationCode } from "./violationCodes";

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
  const paperworkTexts = analysis?.images
    ? Object.values(analysis.images)
        .filter((i) => i.paperwork && i.paperworkText)
        .map((i) => i.paperworkText)
        .join("\n\n")
    : "";
  const code = await getViolationCode(mod.id, analysis?.violationType || "");
  const prompt = `Draft a short, professional email to ${mod.authorityName} reporting a vehicle violation.
Include these details if available:
- Violation: ${analysis?.violationType || ""}
- Description: ${analysis?.details || ""}
- Location: ${location}
- License Plate: ${vehicle.licensePlateState || ""} ${vehicle.licensePlateNumber || ""}
 - Time: ${new Date(time).toISOString()}
${code ? `Applicable code: ${code}` : ""}
${paperworkTexts ? `Attached paperwork:\n${paperworkTexts}` : ""}
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
  const { client, model } = getLlm("draft_email");
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await client.chat.completions.create({
      model,
      messages,
      max_tokens: 800,
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
  recipient: string,
  historyEmails: SentEmail[] = caseData.sentEmails ?? [],
  includeOwner = false,
): Promise<EmailDraft> {
  console.log(
    `draftFollowUp recipient=${recipient} history=${historyEmails
      .map((m) => `${m.sentAt}:${m.subject}`)
      .join("|")}`,
  );
  const history = historyEmails.map((m) => ({
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
  const code = await getViolationCode(
    "oak-park",
    analysis?.violationType || "",
  );
  const owner = includeOwner ? getCaseOwnerContactInfo(caseData) : null;
  const ownerLine = owner
    ? `Owner info: ${owner.email ?? ""} ${owner.phone ?? ""} ${owner.address ?? ""}`
    : "";
  const prompt = `Write a brief follow-up email to ${recipient} about the previous report.
Include these details if available:
- Violation: ${analysis?.violationType || ""}
- Description: ${analysis?.details || ""}
- Location: ${location}
- License Plate: ${vehicle.licensePlateState || ""} ${vehicle.licensePlateNumber || ""}
${code ? `Applicable code: ${code}` : ""}
${ownerLine}
Ask about the current citation status and mention that photos are attached again. Respond with JSON matching this schema: ${JSON.stringify(
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

  console.log(`draftFollowUp prompt: ${prompt.replace(/\n/g, " ")}`);

  const messages = [...baseMessages];
  const { client, model } = getLlm("draft_email");
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await client.chat.completions.create({
      model,
      messages,
      max_tokens: 800,
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
export async function draftOwnerNotification(
  caseData: Case,
  authorities: string[],
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
  const authorityList = authorities.join(", ");
  const authorityLine =
    authorities.length > 0
      ? `Mention that the following authorities have been contacted: ${authorityList}. `
      : "";
  const code = await getViolationCode(
    "oak-park",
    analysis?.violationType || "",
  );
  const prompt = `Draft a short, professional email to the registered owner informing them of their violation and case status. ${authorityLine}Do not reveal any information about the sender. Chastise the owner professionally and note that further action from authorities is pending. Include any applicable municipal or state codes for the violation. Include these details if available:\n- Violation: ${analysis?.violationType || ""}\n- Description: ${analysis?.details || ""}\n- Location: ${location}\n- License Plate: ${vehicle.licensePlateState || ""} ${vehicle.licensePlateNumber || ""}\n- Time: ${new Date(time).toISOString()}\n${code ? `Applicable code: ${code}\n` : ""}Mention that photos are attached. Respond with JSON matching this schema: ${JSON.stringify(
    schema,
  )}`;
  const baseMessages = [
    {
      role: "system",
      content:
        "You create anonymous notification emails for vehicle owners about violations.",
    },
    { role: "user", content: prompt },
  ];
  const messages = [...baseMessages];
  const { client, model } = getLlm("draft_email");
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await client.chat.completions.create({
      model,
      messages,
      max_tokens: 800,
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
