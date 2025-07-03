import type {
  ChatCompletion,
  ChatCompletionChunk,
  ChatCompletionContentPart,
  ChatCompletionCreateParams,
  ChatCompletionMessageParam,
} from "openai/resources/chat/completions";
import { z } from "zod";
import "./zod-setup";
import { getLlm } from "./llm";
import { normalizeLocalizedText } from "./localizedText";
import { US_STATES } from "./usStates";

export type LlmProgress =
  | {
      stage: "upload";
      index: number;
      total: number;
      step?: number;
      steps?: number;
    }
  | {
      stage: "stream";
      received: number;
      total: number;
      done: boolean;
      step?: number;
      steps?: number;
    }
  | {
      stage: "retry";
      attempt: number;
      reason: string;
      step?: number;
      steps?: number;
    };

export class AnalysisError extends Error {
  kind: "truncated" | "parse" | "schema" | "images";
  constructor(kind: "truncated" | "parse" | "schema" | "images") {
    super(kind);
    this.kind = kind;
  }
}

function logBadResponse(
  attempt: number,
  response: string,
  error: unknown,
): void {
  let details: unknown = undefined;
  if (typeof error === "object" && error && "issues" in error) {
    try {
      details = (
        error as { issues: Array<{ path: unknown[]; message: string }> }
      ).issues.map((i) => ({ path: i.path.join("."), message: i.message }));
    } catch {}
  }
  const entry = {
    timestamp: new Date().toISOString(),
    attempt: attempt + 1,
    error: String(error),
    ...(details ? { details } : {}),
    response,
  };
  console.warn(JSON.stringify(entry));
}

function approxTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

const licensePlateStateSchema = z.enum(US_STATES);
const licensePlateNumberSchema = z.string();

export interface PaperworkInfo {
  contact?: string;
  vehicle: {
    vin?: string;
    registrationStatus?: string;
    licensePlateState?: string;
    licensePlateNumber?: string;
  };
  callsToAction?: string[];
}

export const paperworkInfoSchema: z.ZodType<PaperworkInfo> = z.object({
  contact: z.string().optional(),
  vehicle: z
    .object({
      vin: z
        .string()
        .regex(/^[A-HJ-NPR-Z0-9]{17}$/)
        .optional(),
      registrationStatus: z.string().optional(),
      licensePlateState: licensePlateStateSchema.optional(),
      licensePlateNumber: licensePlateNumberSchema.optional(),
    })
    .default({}),
  callsToAction: z.array(z.string()).optional(),
}) as z.ZodType<PaperworkInfo>;

export interface PaperworkAnalysis {
  text: string;
  info: PaperworkInfo | null;
}

export const localizedTextSchema = z.record(z.string());
export const rawLocalizedTextSchema = z.union([
  z.string(),
  localizedTextSchema,
]);

export interface LocalizedText {
  [lang: string]: string;
}

export interface ViolationReport {
  violationType: string;
  details: LocalizedText;
  location?: string;
  language?: string;
  vehicle: {
    make?: string;
    model?: string;
    type?: string;
    color?: string;
    licensePlateState?: string;
    licensePlateNumber?: string;
    plateCategoryOptions?: string[];
  };
  images: Record<
    string,
    {
      representationScore: number;
      highlights?: LocalizedText;
      context?: LocalizedText;
      violation?: boolean;
      paperwork?: boolean;
      paperworkText?: string;
      paperworkInfo?: PaperworkInfo;
    }
  >;
}

export const violationReportSchema: z.ZodType<ViolationReport> = z.object({
  violationType: z.string(),
  details: localizedTextSchema,
  location: z.string().optional(),
  vehicle: z
    .object({
      make: z.string().optional(),
      model: z.string().optional(),
      type: z.string().optional(),
      color: z.string().optional(),
      licensePlateState: licensePlateStateSchema.optional(),
      licensePlateNumber: z.string().optional(),
      plateCategoryOptions: z.array(z.string()).optional(),
    })
    .default({}),
  images: z
    .record(
      z.object({
        representationScore: z.number().min(0).max(1),
        highlights: localizedTextSchema.optional(),
        context: localizedTextSchema.optional(),
        violation: z.boolean().optional(),
        paperwork: z.boolean().optional(),
        paperworkText: z.string().optional(),
        paperworkInfo: paperworkInfoSchema.optional(),
      }),
    )
    .default({}),
}) as z.ZodType<ViolationReport>;

const violationReportInputSchema = z.object({
  violationType: z.string(),
  details: rawLocalizedTextSchema,
  location: z.string().optional(),
  vehicle: z
    .object({
      make: z.string().optional(),
      model: z.string().optional(),
      type: z.string().optional(),
      color: z.string().optional(),
      licensePlateState: licensePlateStateSchema.optional(),
      licensePlateNumber: z.string().optional(),
      plateCategoryOptions: z.array(z.string()).optional(),
    })
    .default({}),
  images: z
    .record(
      z.object({
        representationScore: z.number().min(0).max(1),
        highlights: rawLocalizedTextSchema.optional(),
        context: rawLocalizedTextSchema.optional(),
        violation: z.boolean().optional(),
        paperwork: z.boolean().optional(),
        paperworkText: z.string().optional(),
        paperworkInfo: paperworkInfoSchema.optional(),
      }),
    )
    .default({}),
  language: z.string().optional(),
});

export async function analyzeViolation(
  images: Array<{ url: string; filename: string }>,
  lang = "en",
  progress?: (info: LlmProgress) => void,
  signal?: AbortSignal,
): Promise<ViolationReport> {
  if (images.length === 0) {
    throw new AnalysisError("images");
  }
  const schema = {
    type: "object",
    properties: {
      violationType: { type: "string" },
      details: { type: "string" },
      location: { type: "string" },
      vehicle: {
        type: "object",
        properties: {
          make: { type: "string" },
          model: { type: "string" },
          type: { type: "string" },
          color: { type: "string" },
          licensePlateState: { type: "string", enum: US_STATES },
          licensePlateNumber: { type: "string" },
          plateCategoryOptions: { type: "array", items: { type: "string" } },
        },
      },
      images: {
        type: "object",
        additionalProperties: {
          type: "object",
          properties: {
            representationScore: { type: "number" },
            highlights: { type: "string" },
            context: { type: "string" },
            violation: { type: "boolean" },
            paperwork: { type: "boolean" },
            paperworkText: { type: "string" },
            paperworkInfo: { type: "object" },
          },
        },
      },
    },
  };

  const urls = images.map((i) => i.url);
  const names = images.map((i) => i.filename);
  progress?.({ stage: "upload", index: 0, total: images.length });
  const baseMessages: ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: `You identify vehicle violations and reply in JSON strictly following the provided schema. License plate states should be two uppercase letters. Omit the licensePlateNumber and licensePlateState fields if no plate is visible. Reply in ${lang}.`,
    },
    {
      role: "user",
      content: [
        {
          type: "text",
          text: `Analyze the photo${urls.length > 1 ? "s" : ""} and score each image from 0 to 1 for how well it represents the case. Indicate with a boolean if each photo depicts a violation. If an image is paperwork such as a letter or form, set a paperwork flag and omit the text. Also provide a short description of the evidence each image adds. Include a detailed context description of everything visible in each image, even if it seems irrelevant, under a context field. Use these filenames as keys: ${names.join(", ")}. Return plain strings for details, highlights, and context. Respond with JSON matching this schema: ${JSON.stringify(
            schema,
          )}`,
        },
        ...urls.map((u) => ({ type: "image_url", image_url: { url: u } })),
      ] as unknown as ChatCompletionContentPart[],
    } as ChatCompletionMessageParam,
  ];

  const messages: ChatCompletionMessageParam[] = [...baseMessages];
  const { client, model } = getLlm("analyze_images");
  for (let attempt = 0; attempt < 3; attempt++) {
    const req: ChatCompletionCreateParams = {
      model,
      messages,
      max_tokens: 800,
      response_format: { type: "json_object" },
    };
    if (progress) (req as unknown as Record<string, unknown>).stream = true;
    const response = await client.chat.completions.create(
      req as ChatCompletionCreateParams,
      {
        signal,
      },
    );
    let finish: string | null = null;
    let text = "";
    const totalTokens = req.max_tokens ?? 0;
    let receivedTokens = 0;
    if (progress) {
      for await (const chunk of response as AsyncIterable<ChatCompletionChunk>) {
        const delta = chunk.choices[0]?.delta?.content ?? "";
        text += delta;
        finish = chunk.choices[0]?.finish_reason || null;
        receivedTokens = approxTokens(text);
        progress({
          stage: "stream",
          received: receivedTokens,
          total: totalTokens,
          done: false,
        });
      }
      progress({
        stage: "stream",
        received: receivedTokens,
        total: totalTokens,
        done: true,
      });
    } else {
      finish = (response as ChatCompletion).choices[0]?.finish_reason ?? null;
      text = (response as ChatCompletion).choices[0]?.message?.content ?? "{}";
    }

    if (finish === "length") {
      logBadResponse(attempt, text, "truncated");
      progress?.({ stage: "retry", attempt: attempt + 1, reason: "truncated" });
      if (attempt === 2) throw new AnalysisError("truncated");
      messages.push({ role: "assistant", content: text });
      messages.push({
        role: "user",
        content:
          "Your previous reply was cut off. Please resend the complete JSON only.",
      });
      continue;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch (err) {
      logBadResponse(attempt, text, err);
      progress?.({ stage: "retry", attempt: attempt + 1, reason: "parse" });
      if (attempt === 2) throw new AnalysisError("parse");
      messages.push({ role: "assistant", content: text });
      messages.push({
        role: "user",
        content: `The previous response was not valid JSON: ${err}. Please reply with valid JSON only.`,
      });
      continue;
    }

    try {
      const raw = violationReportInputSchema.parse(parsed);
      const resultLang = raw.language ?? lang;
      const images: ViolationReport["images"] = {};
      for (const [name, info] of Object.entries(raw.images)) {
        images[name] = {
          representationScore: info.representationScore,
          ...(info.highlights !== undefined && {
            highlights: normalizeLocalizedText(info.highlights, resultLang),
          }),
          ...(info.context !== undefined && {
            context: normalizeLocalizedText(info.context, resultLang),
          }),
          ...(info.violation !== undefined && { violation: info.violation }),
          ...(info.paperwork !== undefined && { paperwork: info.paperwork }),
          ...(info.paperworkText !== undefined && {
            paperworkText: info.paperworkText,
          }),
          ...(info.paperworkInfo !== undefined && {
            paperworkInfo: info.paperworkInfo,
          }),
        };
      }
      return {
        violationType: raw.violationType,
        details: normalizeLocalizedText(raw.details, resultLang),
        location: raw.location,
        language: resultLang,
        vehicle: raw.vehicle,
        images,
      };
    } catch (err) {
      logBadResponse(attempt, text, err);
      progress?.({ stage: "retry", attempt: attempt + 1, reason: "schema" });
      if (attempt === 2) throw new AnalysisError("schema");
      messages.push({ role: "assistant", content: text });
      messages.push({
        role: "user",
        content: `The JSON did not match the schema: ${err}. Please reply with corrected JSON only.`,
      });
    }
  }
  throw new AnalysisError("schema");
}

export async function extractPaperworkInfo(
  text: string,
  lang = "en",
): Promise<PaperworkInfo> {
  const schema = {
    type: "object",
    properties: {
      contact: { type: "string" },
      vehicle: {
        type: "object",
        properties: {
          vin: { type: "string", pattern: "^[A-HJ-NPR-Z0-9]{17}$" },
          registrationStatus: { type: "string" },
          licensePlateState: { type: "string", enum: US_STATES },
          licensePlateNumber: { type: "string" },
        },
      },
      callsToAction: { type: "array", items: { type: "string" } },
    },
  };

  const baseMessages: ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: `You extract structured vehicle information from text and reply in JSON strictly following the provided schema. A VIN is a 17-character string of digits and capital letters except I, O, and Q. Reply in ${lang}.`,
    },
    {
      role: "user",
      content: `Analyze the following text and extract the registered owner contact information, the VIN, vehicle registration status, license plate details and any calls to action. Omit the VIN field if none is present. Respond with JSON matching this schema: ${JSON.stringify(
        schema,
      )}`,
    },
    { role: "user", content: text },
  ];

  const messages: ChatCompletionMessageParam[] = [...baseMessages];
  const { client, model } = getLlm("extract_info");
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await client.chat.completions.create({
      model,
      messages,
      max_tokens: 400,
      response_format: { type: "json_object" },
    });
    const output = res.choices[0]?.message?.content ?? "{}";
    try {
      const parsed = JSON.parse(output);
      return paperworkInfoSchema.parse(parsed);
    } catch (err) {
      logBadResponse(attempt, output, err);
      if (attempt === 2) return {} as PaperworkInfo;
      messages.push({ role: "assistant", content: output });
      messages.push({
        role: "user",
        content: `The previous JSON did not match the schema: ${err}. Please reply with corrected JSON only.`,
      });
    }
  }
  return {} as PaperworkInfo;
}

export async function ocrPaperwork(
  image: { url: string },
  lang = "en",
  progress?: (info: LlmProgress) => void,
  signal?: AbortSignal,
): Promise<PaperworkAnalysis> {
  const baseMessages: ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: `You transcribe text from public paperwork. Return the text exactly as it appears, with no redactions or omissions. Reply in ${lang}.`,
    },
    {
      role: "user",
      content: [
        { type: "text", text: "Transcribe all text from this image." },
        { type: "image_url", image_url: { url: image.url } },
      ],
    },
  ];

  const messages: ChatCompletionMessageParam[] = [...baseMessages];
  progress?.({ stage: "upload", index: 0, total: 1 });
  const { client, model } = getLlm("ocr_paperwork");
  for (let attempt = 0; attempt < 3; attempt++) {
    const req: ChatCompletionCreateParams = {
      model,
      messages,
      max_tokens: 800,
    };
    if (progress) (req as unknown as Record<string, unknown>).stream = true;
    const res = await client.chat.completions.create(
      req as ChatCompletionCreateParams,
      {
        signal,
      },
    );
    let text = "";
    const totalTokens = req.max_tokens ?? 0;
    let receivedTokens = 0;
    if (progress) {
      for await (const chunk of res as AsyncIterable<ChatCompletionChunk>) {
        const delta = chunk.choices[0]?.delta?.content ?? "";
        text += delta;
        receivedTokens = approxTokens(text);
        progress({
          stage: "stream",
          received: receivedTokens,
          total: totalTokens,
          done: false,
        });
      }
      progress({
        stage: "stream",
        received: receivedTokens,
        total: totalTokens,
        done: true,
      });
    } else {
      text = (res as ChatCompletion).choices[0]?.message?.content ?? "";
    }
    if (text.trim()) {
      const info = await extractPaperworkInfo(text.trim(), lang);
      return { text: text.trim(), info };
    }
    logBadResponse(attempt, text, new Error("Empty OCR result"));
    if (attempt < 2) {
      messages.push({ role: "assistant", content: text });
      messages.push({
        role: "user",
        content: "Please reply with just the text.",
      });
    }
  }
  return { text: "", info: null };
}

export interface ProfileReview {
  flagged: boolean;
  reason?: string;
}

export const profileReviewSchema: z.ZodType<ProfileReview> = z.object({
  flagged: z.boolean(),
  reason: z.string().optional(),
}) as z.ZodType<ProfileReview>;

export async function reviewProfile(profile: {
  name?: string | null;
  bio?: string | null;
  socialLinks?: string | null;
}): Promise<ProfileReview> {
  const schema = {
    type: "object",
    properties: { flagged: { type: "boolean" }, reason: { type: "string" } },
  };
  const messages: ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: `You review user profiles for obscene or inappropriate content and respond in JSON strictly following the provided schema: ${JSON.stringify(schema)}`,
    },
    {
      role: "user",
      content: `Name: ${profile.name ?? ""}\nBio: ${profile.bio ?? ""}\nLinks: ${profile.socialLinks ?? ""}`,
    },
  ];
  const { client, model } = getLlm("profile_review");
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await client.chat.completions.create({
      model,
      messages,
      max_tokens: 50,
      response_format: { type: "json_object" },
    });
    const text = res.choices[0]?.message?.content ?? "{}";
    try {
      const parsed = JSON.parse(text);
      return profileReviewSchema.parse(parsed);
    } catch (err) {
      logBadResponse(attempt, text, err);
      if (attempt === 2) throw new AnalysisError("schema");
      messages.push({ role: "assistant", content: text });
      messages.push({
        role: "user",
        content: `The JSON did not match the schema: ${err}. Please reply with corrected JSON only.`,
      });
    }
  }
  throw new AnalysisError("schema");
}
