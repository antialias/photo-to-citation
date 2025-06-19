import fs from "node:fs";
import path from "node:path";

export function readJsonFile<T>(file: string, fallback: T): T {
  if (!fs.existsSync(file)) return fallback;
  try {
    const text = fs.readFileSync(file, "utf8");
    return JSON.parse(text) as T;
  } catch {
    return fallback;
  }
}

export function writeJsonFile(file: string, data: unknown): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}
