import dotenv from "dotenv";
import OpenAI from "openai";
import { z } from "zod";
import "./zod-setup";

dotenv.config();

export class AnalysisError extends Error {
  kind: "truncated" | "parse" | "schema";
  constructor(kind: "truncated" | "parse" | "schema") {
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

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
  dangerouslyAllowBrowser: true,
});

const licensePlateStateSchema = z.string().regex(/^[A-Z]{2}$/);
const licensePlateNumberSchema = z.string();

export const paperworkInfoSchema = z.object({
  contact: z.string().optional(),
  vehicle: z
    .object({
      vin: z.string().optional(),
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
): Promise<ViolationReport> {
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
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      max_tokens: 800,
      response_format: { type: "json_object" },
    });
    const finish = response.choices[0]?.finish_reason;
    const text = response.choices[0]?.message?.content ?? "{}";

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
): Promise<PaperworkInfo> {
  const schema = {
    type: "object",
    properties: {
      contact: { type: "string" },
      vehicle: {
        type: "object",
        properties: {
          vin: { type: "string" },
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
        "You extract structured vehicle information from text and reply in JSON strictly following the provided schema.",
    },
    {
      role: "user",
      content: `Analyze the following text and extract the registered owner contact information, VIN, vehicle registration status, license plate details and any calls to action. Respond with JSON matching this schema: ${JSON.stringify(
        schema,
      )}`,
    },
    { role: "user", content: text },
  ];

  const messages = [...baseMessages];
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await openai.chat.completions.create({
      model: "gpt-4o",
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

export async function ocrPaperwork(image: {
  url: string;
}): Promise<PaperworkAnalysis> {
  const baseMessages = [
    {
      role: "system",
      content:
        "You transcribe text from images of paperwork and respond with only the text.",
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
    const res = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      max_tokens: 800,
    });
    const text = res.choices[0]?.message?.content ?? "";
    if (text.trim()) {
      const info = await extractPaperworkInfo(text.trim());
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
