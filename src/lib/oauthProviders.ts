import fs from "node:fs";
import path from "node:path";
import { config } from "./config";
import { readJsonFile, writeJsonFile } from "./fileUtils";

export interface OauthProviderStatus {
  id: string;
  enabled: boolean;
}

const dataFile = config.OAUTH_PROVIDER_FILE
  ? path.resolve(config.OAUTH_PROVIDER_FILE)
  : path.join(process.cwd(), "data", "oauthProviders.json");

const defaultProviders = ["google", "facebook"];

function defaultStatuses(): OauthProviderStatus[] {
  return defaultProviders.map((id) => ({ id, enabled: true }));
}

function loadStatuses(): OauthProviderStatus[] {
  if (!fs.existsSync(dataFile)) {
    const defaults = defaultStatuses();
    writeJsonFile(dataFile, defaults);
    return defaults;
  }
  return readJsonFile<OauthProviderStatus[]>(dataFile, defaultStatuses());
}

function saveStatuses(statuses: OauthProviderStatus[]): void {
  writeJsonFile(dataFile, statuses);
}

export function getOauthProviderStatuses(): OauthProviderStatus[] {
  return loadStatuses();
}

export function setOauthProviderEnabled(
  id: string,
  enabled: boolean,
): OauthProviderStatus | undefined {
  const list = loadStatuses();
  const idx = list.findIndex((p) => p.id === id);
  if (idx === -1) return undefined;
  list[idx] = { ...list[idx], enabled };
  saveStatuses(list);
  return list[idx];
}
