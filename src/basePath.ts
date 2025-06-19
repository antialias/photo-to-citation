import { getConfig } from "./lib/config";

export const BASE_PATH = getConfig().NEXT_PUBLIC_BASE_PATH || "";
export function withBasePath(path: string): string {
  return `${BASE_PATH}${path}`;
}
