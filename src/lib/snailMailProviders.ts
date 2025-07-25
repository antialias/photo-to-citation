import fs from "node:fs";
import path from "node:path";
import { config } from "./config";
import { readJsonFile, writeJsonFile } from "./fileUtils";
import { snailMailProviders } from "./snailMail";

export interface SnailMailProviderStatus {
  id: string;
  active: boolean;
  failureCount: number;
  ready?: boolean;
  message?: string;
  testable?: boolean;
}

const dataFile = config.SNAIL_MAIL_PROVIDER_FILE
  ? path.resolve(config.SNAIL_MAIL_PROVIDER_FILE)
  : path.join(process.cwd(), "data", "snailMailProviders.json");

function defaultStatuses(): SnailMailProviderStatus[] {
  return Object.keys(snailMailProviders).map((id, idx) => ({
    id,
    active: idx === 0,
    failureCount: 0,
  }));
}

function loadStatuses(): SnailMailProviderStatus[] {
  if (!fs.existsSync(dataFile)) {
    const defaults = defaultStatuses();
    writeJsonFile(dataFile, defaults);
    return defaults;
  }
  return readJsonFile<SnailMailProviderStatus[]>(dataFile, defaultStatuses());
}

function saveStatuses(list: SnailMailProviderStatus[]): void {
  writeJsonFile(dataFile, list);
}

export function getSnailMailProviderStatuses(): SnailMailProviderStatus[] {
  const list = loadStatuses();
  return list.map((s) => {
    const provider = snailMailProviders[s.id];
    const check = provider.check?.();
    return {
      ...s,
      ready: check?.ready,
      message: check?.message,
      testable: !!provider.test,
    };
  });
}

export function setActiveSnailMailProvider(
  id: string,
): SnailMailProviderStatus | undefined {
  const list = loadStatuses();
  if (!list.some((p) => p.id === id)) return undefined;
  const updated = list.map((p) => ({ ...p, active: p.id === id }));
  saveStatuses(updated);
  return updated.find((p) => p.id === id);
}

export function recordProviderFailure(id: string): void {
  const list = loadStatuses();
  const idx = list.findIndex((p) => p.id === id);
  if (idx === -1) return;
  list[idx] = { ...list[idx], failureCount: list[idx].failureCount + 1 };
  saveStatuses(list);
}

export function recordProviderSuccess(id: string): void {
  const list = loadStatuses();
  const idx = list.findIndex((p) => p.id === id);
  if (idx === -1) return;
  list[idx] = { ...list[idx], failureCount: 0 };
  saveStatuses(list);
}
