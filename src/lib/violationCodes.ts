import fs from "node:fs";
import path from "node:path";
import type OpenAI from "openai";
import { runCompletion } from "./openai";

export interface ViolationCodeMap {
  [municipality: string]: Record<string, string>;
}

const dataFile = process.env.VIOLATION_CODE_FILE
  ? path.resolve(process.env.VIOLATION_CODE_FILE)
  : path.join(process.cwd(), "data", "violationCodes.json");

function loadCodes(): ViolationCodeMap {
  if (!fs.existsSync(dataFile)) return {};
  try {
    return JSON.parse(fs.readFileSync(dataFile, "utf8")) as ViolationCodeMap;
  } catch {
    return {};
  }
}

function saveCodes(map: ViolationCodeMap): void {
  fs.mkdirSync(path.dirname(dataFile), { recursive: true });
  fs.writeFileSync(dataFile, JSON.stringify(map, null, 2));
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
    const messages = [
      {
        role: "system",
        content:
          "You look up municipal or state codes for vehicle violations and respond in JSON only.",
      },
      { role: "user", content: prompt },
    ];
    const { text } = await runCompletion(
      "lookup_code",
      messages as OpenAI.ChatCompletionMessageParam[],
      60,
      { type: "json_object" },
    );
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
