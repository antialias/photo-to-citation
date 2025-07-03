import path from "node:path";
import { readJsonFile, writeJsonFile } from "./fileUtils";

export interface MockEmailSettings {
  to: string;
}

const settingsFile = path.join(process.cwd(), "data", "mockEmail.json");
const defaultSettings: MockEmailSettings = { to: "" };

export function getMockEmailSettings(): MockEmailSettings {
  return readJsonFile<MockEmailSettings>(settingsFile, defaultSettings);
}

export function setMockEmailTo(to: string): MockEmailSettings {
  const settings = { to };
  writeJsonFile(settingsFile, settings);
  return settings;
}
