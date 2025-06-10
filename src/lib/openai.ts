import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
  dangerouslyAllowBrowser: true,
});

export interface ViolationReport {
  violationType: string;
  details: string;
  location?: string;
  vehicle: {
    make?: string;
    model?: string;
    type?: string;
    color?: string;
    licensePlateState?: string;
    licensePlateNumber?: string;
  };
}

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

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
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
    ],
    max_tokens: 300,
    response_format: { type: "json_object" },
  });
  const text = response.choices[0]?.message?.content ?? "{}";
  return JSON.parse(text);
}
