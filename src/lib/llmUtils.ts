import type OpenAI from "openai";
import type {
  ChatCompletion,
  ChatCompletionChunk,
  ChatCompletionCreateParams,
  ChatCompletionMessageParam,
} from "openai/resources/chat/completions";
import type { ZodSchema } from "zod";
import "./zod-setup";

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

export function logBadResponse(
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

export function approxTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export interface ChatWithSchemaOptions {
  maxTokens?: number;
  progress?: (info: LlmProgress) => void;
  signal?: AbortSignal;
}

export async function chatWithSchema<T>(
  client: OpenAI,
  model: string,
  messages: ChatCompletionMessageParam[],
  schema: ZodSchema<T>,
  opts: ChatWithSchemaOptions = {},
): Promise<T> {
  const { maxTokens = 800, progress, signal } = opts;
  for (let attempt = 0; attempt < 3; attempt++) {
    const req: ChatCompletionCreateParams = {
      model,
      messages,
      max_tokens: maxTokens,
      response_format: { type: "json_object" },
    };
    if (progress) (req as unknown as Record<string, unknown>).stream = true;
    const res = await client.chat.completions.create(req, { signal });
    let finish: string | null = null;
    let text = "";
    const total = maxTokens;
    let received = 0;
    if (progress) {
      for await (const chunk of res as unknown as AsyncIterable<ChatCompletionChunk>) {
        const delta = chunk.choices[0]?.delta?.content ?? "";
        text += delta;
        finish = chunk.choices[0]?.finish_reason || null;
        received = approxTokens(text);
        progress({ stage: "stream", received, total, done: false });
      }
      progress({ stage: "stream", received, total, done: true });
    } else {
      finish = (res as ChatCompletion).choices[0]?.finish_reason ?? null;
      text = (res as ChatCompletion).choices[0]?.message?.content ?? "{}";
    }
    if (finish === "length") {
      logBadResponse(attempt, text, "truncated");
      progress?.({ stage: "retry", attempt: attempt + 1, reason: "truncated" });
      if (attempt === 2) throw new Error("truncated");
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
      if (attempt === 2) throw new Error("parse");
      messages.push({ role: "assistant", content: text });
      messages.push({
        role: "user",
        content: `The previous response was not valid JSON: ${err}. Please reply with valid JSON only.`,
      });
      continue;
    }
    try {
      return schema.parse(parsed);
    } catch (err) {
      logBadResponse(attempt, text, err);
      progress?.({ stage: "retry", attempt: attempt + 1, reason: "schema" });
      if (attempt === 2) throw new Error("schema");
      messages.push({ role: "assistant", content: text });
      messages.push({
        role: "user",
        content: `The JSON did not match the schema: ${err}. Please reply with corrected JSON only.`,
      });
    }
  }
  throw new Error("schema");
}
