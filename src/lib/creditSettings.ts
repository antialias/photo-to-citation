import path from "node:path";
import { readJsonFile, writeJsonFile } from "./fileUtils";

export interface CreditSettings {
  usdPerCredit: number;
}

const settingsFile = path.join(process.cwd(), "data", "creditSettings.json");
const defaultSettings: CreditSettings = { usdPerCredit: 1 };

export function getCreditSettings(): CreditSettings {
  return readJsonFile<CreditSettings>(settingsFile, defaultSettings);
}

export function setExchangeRate(usdPerCredit: number): CreditSettings {
  const settings = { usdPerCredit };
  writeJsonFile(settingsFile, settings);
  return settings;
}
