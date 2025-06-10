import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import OpenAI from "openai";
import { z } from "zod";

dotenv.config();

const logFile = process.env.LLM_RESPONSE_LOG
  ? path.resolve(process.env.LLM_RESPONSE_LOG)
  : path.join(process.cwd(), "logs", "llm-retries.log");

function logBadResponse(
  attempt: number,
  response: string,
  error: unknown,
): void {
  fs.mkdirSync(path.dirname(logFile), { recursive: true });
  const entry = {
    timestamp: new Date().toISOString(),
    attempt: attempt + 1,
    error: String(error),
    response,
  };
  fs.appendFileSync(logFile, `${JSON.stringify(entry)}\n`);
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
  dangerouslyAllowBrowser: true,
});

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
      licensePlateState: z.string().optional(),
      licensePlateNumber: z.string().optional(),
    })
    .default({}),
});

export type ViolationReport = z.infer<typeof violationReportSchema>;

export async function analyzeViolation(
  imageUrls: string | string[],
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
          licensePlateState: { type: "string" },
          licensePlateNumber: { type: "string" },
        },
      },
    },
  };

  const urls = Array.isArray(imageUrls) ? imageUrls : [imageUrls];
  const baseMessages = [
    {
      role: "system",
      content:
        "You identify vehicle violations and reply in JSON strictly following the provided schema.",
    },
    {
      role: "user",
      content: [
        {
          type: "text",
          text: `Analyze the photo${urls.length > 1 ? "s" : ""} and respond with JSON matching this schema: ${JSON.stringify(
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
      max_tokens: 300,
      response_format: { type: "json_object" },
    });
    const text = response.choices[0]?.message?.content ?? "{}";
    try {
      const parsed = JSON.parse(text);
      return violationReportSchema.parse(parsed);
    } catch (err) {
      logBadResponse(attempt, text, err);
      if (attempt === 2) throw err;
      messages.push({ role: "assistant", content: text });
      messages.push({
        role: "user",
        content: `The previous JSON did not match the schema: ${err}. Please reply with corrected JSON only.`,
      });
    }
  }
  throw new Error("Failed to analyze violation");
}
