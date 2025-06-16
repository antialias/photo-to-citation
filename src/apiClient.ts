import { withBasePath } from "./basePath";

export async function apiFetch(input: string, init?: RequestInit) {
  return fetch(withBasePath(input), init);
}

export function apiEventSource(input: string) {
  return new EventSource(withBasePath(input));
}
