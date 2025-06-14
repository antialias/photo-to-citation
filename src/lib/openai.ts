import type OpenAI from "openai";
import type {
  ChatCompletionChunk,
  ChatCompletionMessageParam,
} from "openai/resources/chat/completions";
import { z } from "zod";
import "./zod-setup";
import { getLlm } from "./llm";

export interface LlmProgress {
  type: "upload" | "stream";
  current: number;
  total: number;
}

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

export async function runCompletion(
  feature: LlmFeature,
  messages: OpenAI.ChatCompletionMessageParam[],
  maxTokens: number,
  responseFormat: { type: "json_object" } | undefined,
  progress?: (update: LlmProgress) => void,
): Promise<{ text: string; finish: string | null }> {
  const { client, model } = getLlm(feature);
  if (progress) {
    const stream = (await client.chat.completions.create({
      model,
      messages,
      max_tokens: maxTokens,
      response_format: responseFormat,
      stream: true,
    })) as AsyncIterable<OpenAI.ChatCompletionChunk>;
    let text = "";
    let tokens = 0;
    let finish: string | null = null;
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) {
        text += delta;
        tokens += delta.split(/\s+/).length;
        progress({ type: "stream", current: tokens, total: maxTokens });
      }
      if (chunk.choices[0]?.finish_reason) {
        finish = chunk.choices[0]?.finish_reason ?? null;
      }
    }
    return { text, finish };
  }
  const res = await client.chat.completions.create({
    model,
    messages,
    max_tokens: maxTokens,
    response_format: responseFormat,
  });
  return {
    text: res.choices[0]?.message?.content ?? "",
    finish: res.choices[0]?.finish_reason ?? null,
  };
}

const licensePlateStateSchema = z.string().regex(/^[A-Z]{2}$/);
const licensePlateNumberSchema = z.string();

export const paperworkInfoSchema = z.object({
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
});

export type PaperworkInfo = z.infer<typeof paperworkInfoSchema>;

export interface PaperworkAnalysis {
  text: string;
  info: PaperworkInfo | null;
}

export const violationReportSchema = z.object({
  violationType: z.string(),
  details: z.string(),
  location: z.string().optional(),
  vehicle: z
    .object({
      make: z.string().optional(),
      model: z.string().optional(),
      type: z.string().optional(),
      color: z.string().optional(),
      licensePlateState: z
        .string()
        .regex(/^[A-Z]{2}$/)
        .optional(),
      licensePlateNumber: z.string().optional(),
    })
    .default({}),
  images: z
    .record(
      z.object({
        representationScore: z.number().min(0).max(1),
        highlights: z.string().optional(),
        violation: z.boolean().optional(),
        paperwork: z.boolean().optional(),
        paperworkText: z.string().optional(),
        paperworkInfo: paperworkInfoSchema.optional(),
      }),
    )
    .default({}),
});

export type ViolationReport = z.infer<typeof violationReportSchema>;

export async function analyzeViolation(
  images: Array<{ url: string; filename: string }>,
  progress?: (update: LlmProgress) => void,
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
          licensePlateState: { type: "string", pattern: "^[A-Z]{2}$" },
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
  urls.forEach((_, i) => {
    progress?.({ type: "upload", current: i + 1, total: urls.length });
  });
  const baseMessages = [
    {
      role: "system",
      content:
        "You identify vehicle violations and reply in JSON strictly following the provided schema. License plate states should be two uppercase letters.",
    },
    {
      role: "user",
      content: [
        {
          type: "text",
          text: `Analyze the photo${urls.length > 1 ? "s" : ""} and score each image from 0 to 1 for how well it represents the case. Indicate with a boolean if each photo depicts a violation. If an image is paperwork such as a letter or form, set a paperwork flag and omit the text. Also provide a short description of the evidence each image adds. Use these filenames as keys: ${names.join(", ")}. Respond with JSON matching this schema: ${JSON.stringify(
            schema,
          )}`,
        },
        ...urls.map((u) => ({ type: "image_url", image_url: { url: u } })),
      ],
    },
  ];

  const messages = [...baseMessages];
  for (let attempt = 0; attempt < 3; attempt++) {
    const { text, finish } = await runCompletion(
      "analyze_images",
      messages as ChatCompletionMessageParam[],
      800,
      { type: "json_object" },
      progress,
    );

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
      return violationReportSchema.parse(parsed);
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
  progress?: (update: LlmProgress) => void,
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
          licensePlateState: { type: "string" },
          licensePlateNumber: { type: "string" },
        },
      },
      callsToAction: { type: "array", items: { type: "string" } },
    },
  };

  const baseMessages = [
    {
      role: "system",
      content:
        "You extract structured vehicle information from text and reply in JSON strictly following the provided schema. A VIN is a 17-character string of digits and capital letters except I, O, and Q.",
    },
    {
      role: "user",
      content: `Analyze the following text and extract the registered owner contact information, the VIN, vehicle registration status, license plate details and any calls to action. Omit the VIN field if none is present. Respond with JSON matching this schema: ${JSON.stringify(
        schema,
      )}`,
    },
    { role: "user", content: text },
  ];

  const messages = [...baseMessages];
  for (let attempt = 0; attempt < 3; attempt++) {
    const { text: output } = await runCompletion(
      "extract_info",
      messages as ChatCompletionMessageParam[],
      400,
      { type: "json_object" },
      progress,
    );
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
  image: {
    url: string;
  },
  progress?: (update: LlmProgress) => void,
): Promise<PaperworkAnalysis> {
  const baseMessages = [
    {
      role: "system",
      content:
        "You transcribe text from public paperwork. Return the text exactly as it appears, with no redactions or omissions.",
    },
    {
      role: "user",
      content: [
        { type: "text", text: "Transcribe all text from this image." },
        { type: "image_url", image_url: { url: image.url } },
      ],
    },
  ];

  const messages = [...baseMessages];
  for (let attempt = 0; attempt < 3; attempt++) {
    const { text } = await runCompletion(
      "ocr_paperwork",
      messages as ChatCompletionMessageParam[],
      800,
      undefined,
      progress,
    );
    const trimmed = text.trim();
    if (trimmed) {
      const info = await extractPaperworkInfo(trimmed, progress);
      return { text: trimmed, info };
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
