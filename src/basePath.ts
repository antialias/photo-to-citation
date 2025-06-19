import { config } from "./lib/config";

export const BASE_PATH = config.NEXT_PUBLIC_BASE_PATH || "";
export function withBasePath(path: string): string {
  return `${BASE_PATH}${path}`;
}
