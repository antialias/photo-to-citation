import dotenv from "dotenv";
import OpenAI from "openai";
import { z } from "zod";

dotenv.config();

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
          text: `Analyze the photo${urls.length > 1 ? "s" : ""} and score each image from 0 to 1 for how well it represents the case. Indicate with a boolean if each photo depicts a violation. If an image is paperwork such as a letter or form, set a paperwork flag and transcribe all text from it. Also provide a short description of the evidence each image adds. Use these filenames as keys: ${names.join(", ")}. Respond with JSON matching this schema: ${JSON.stringify(
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
