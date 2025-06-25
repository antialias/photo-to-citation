import { withBasePath } from "./basePath";

export async function apiFetch(input: string, init?: RequestInit) {
  return fetch(withBasePath(input), init);
}

export async function fetchJson<T>(
  input: string,
  init?: RequestInit,
): Promise<T> {
  const res = await apiFetch(input, init);
  if (!res.ok) throw new Error(res.statusText);
  return (await res.json()) as T;
}

export function queryFn<T>(input: string) {
  return () => fetchJson<T>(input);
}

export function apiEventSource(input: string) {
  return new EventSource(withBasePath(input));
}
