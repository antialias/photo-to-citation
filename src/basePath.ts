import { getPublicEnv } from "./publicEnv";

export function getBasePath(): string {
  if (typeof window !== "undefined") {
    return getPublicEnv().NEXT_PUBLIC_BASE_PATH ?? "";
  }
  return process.env.NEXT_PUBLIC_BASE_PATH || "";
}

export function withBasePath(path: string): string {
  return `${getBasePath()}${path}`;
}
