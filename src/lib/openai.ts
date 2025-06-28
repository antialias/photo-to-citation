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
import type { LocalizedText } from "./localization";
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
  const entry = {
    timestamp: new Date().toISOString(),
    attempt: attempt + 1,
    error: String(error),
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
  text: LocalizedText;
  info: PaperworkInfo | null;
  language: string;
}

interface BasicViolationReport {
  violationType: string;
  details: string;
  location?: string;
  vehicle: ViolationReport["vehicle"];
  images: Record<
    string,
    {
      representationScore: number;
      highlights?: string;
      context?: string;
      violation?: boolean;
      paperwork?: boolean;
      paperworkText?: string;
      paperworkInfo?: PaperworkInfo;
    }
  >;
}

export interface ViolationReport {
  violationType: string;
  details: LocalizedText;
  location?: string;
  language: string;
  vehicle: {
    make?: string;
    model?: string;
    type?: string;
    color?: string;
    licensePlateState?: string;
    licensePlateNumber?: string;
  };
  images: Record<
    string,
    {
      representationScore: number;
      highlights_map?: LocalizedText;
      context_map?: LocalizedText;
      violation?: boolean;
      paperwork?: boolean;
      paperworkText_map?: LocalizedText;
      paperworkInfo?: PaperworkInfo;
    }
  >;
}

export const violationReportSchema: z.ZodType<BasicViolationReport> = z.object({
  violationType: z.string(),
  details: z.string(),
  location: z.string().optional(),
  vehicle: z
    .object({
      make: z.string().optional(),
      model: z.string().optional(),
      type: z.string().optional(),
      color: z.string().optional(),
      licensePlateState: licensePlateStateSchema.optional(),
      licensePlateNumber: z.string().optional(),
    })
    .default({}),
  images: z
    .record(
      z.object({
        representationScore: z.number().min(0).max(1),
        highlights: z.string().optional(),
        context: z.string().optional(),
        violation: z.boolean().optional(),
        paperwork: z.boolean().optional(),
        paperworkText: z.string().optional(),
        paperworkInfo: paperworkInfoSchema.optional(),
      }),
    )
    .default({}),
}) as z.ZodType<ViolationReport>;

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
      content: `You identify vehicle violations and reply in JSON strictly following the provided schema. Reply in ${lang}. License plate states should be two uppercase letters. Omit the licensePlateNumber and licensePlateState fields if no plate is visible.`,
    },
    {
      role: "user",
      content: [
        {
          type: "text",
          text: `Analyze the photo${urls.length > 1 ? "s" : ""} and score each image from 0 to 1 for how well it represents the case. Indicate with a boolean if each photo depicts a violation. If an image is paperwork such as a letter or form, set a paperwork flag and omit the text. Also provide a short description of the evidence each image adds. Include a detailed context description of everything visible in each image, even if it seems irrelevant, under a context field. Use these filenames as keys: ${names.join(", ")}. Respond with JSON matching this schema: ${JSON.stringify(
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
      if (attempt === 2) throw new AnalysisError("parse");
      messages.push({ role: "assistant", content: text });
      messages.push({
        role: "user",
        content: `The previous response was not valid JSON: ${err}. Please reply with valid JSON only.`,
      });
      continue;
    }

    try {
      const basic = violationReportSchema.parse(parsed);
      const converted: ViolationReport = {
        ...basic,
        language: lang,
        details: { [lang]: basic.details as unknown as string },
        images: Object.fromEntries(
          Object.entries(basic.images).map(([k, v]) => [
            k,
            {
              ...v,
              highlights_map: v.highlights
                ? { [lang]: v.highlights }
                : undefined,
              context_map: v.context ? { [lang]: v.context } : undefined,
              paperworkText_map: v.paperworkText
                ? { [lang]: v.paperworkText }
                : undefined,
            },
          ]),
        ),
      };
      return converted;
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
      content: `You extract structured vehicle information from text and reply in JSON strictly following the provided schema. Reply in ${lang}. A VIN is a 17-character string of digits and capital letters except I, O, and Q.`,
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
      return { text: { [lang]: text.trim() }, info, language: lang };
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
  return { text: {}, info: null, language: lang };
}
