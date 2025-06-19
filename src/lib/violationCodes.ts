import path from "node:path";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { getConfig } from "./config";
import { readJsonFile, writeJsonFile } from "./fileUtils";
import { getLlm } from "./llm";

export interface ViolationCodeMap {
  [municipality: string]: Record<string, string>;
}

const cfg = getConfig();
const dataFile = cfg.VIOLATION_CODE_FILE
  ? path.resolve(cfg.VIOLATION_CODE_FILE)
  : path.join(process.cwd(), "data", "violationCodes.json");

function loadCodes(): ViolationCodeMap {
  return readJsonFile<ViolationCodeMap>(dataFile, {});
}

function saveCodes(map: ViolationCodeMap): void {
  writeJsonFile(dataFile, map);
}

function getStoredCode(municipality: string, violation: string): string | null {
  const map = loadCodes();
  return map[municipality]?.[violation] ?? null;
}

function setStoredCode(
  municipality: string,
  violation: string,
  code: string,
): void {
  const map = loadCodes();
  if (!map[municipality]) map[municipality] = {};
  map[municipality][violation] = code;
  saveCodes(map);
}

export async function getViolationCode(
  municipality: string,
  violation: string,
): Promise<string | null> {
  const cached = getStoredCode(municipality, violation);
  if (cached) return cached;
  if (!municipality || !violation) return null;
  try {
    const schema = { type: "object", properties: { code: { type: "string" } } };
    const prompt = `What municipal or state code applies to the following violation?\nMunicipality: ${municipality}\nViolation: ${violation}\nRespond with JSON matching this schema: ${JSON.stringify(
      schema,
    )}`;
    const messages: ChatCompletionMessageParam[] = [
      {
        role: "system",
        content:
          "You look up municipal or state codes for vehicle violations and respond in JSON only.",
      },
      { role: "user", content: prompt },
    ];
    const { client, model } = getLlm("lookup_code");
    const res = await client.chat.completions.create({
      model,
      messages,
      max_tokens: 60,
      response_format: { type: "json_object" },
    });
    const text = res.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(text) as { code?: string };
    const code = parsed.code?.trim();
    if (code) {
      setStoredCode(municipality, violation, code);
      return code;
    }
  } catch (err) {
    console.error("lookupViolationCode failed", err);
  }
  return null;
}
