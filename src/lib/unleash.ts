import type { Unleash } from "unleash-client";
import { initialize } from "unleash-client";
import { getConfig } from "./config";

let client: Unleash | undefined;

export function getUnleash(): Unleash {
  if (!client) {
    const { UNLEASH_URL, UNLEASH_API_TOKEN } = getConfig();
    if (!UNLEASH_URL) {
      client = {
        isEnabled() {
          return Boolean(process.env.TEST_APIS);
        },
      } as unknown as Unleash;
    } else {
      client = initialize({
        appName: "photo-to-citation",
        url: UNLEASH_URL,
        customHeaders: UNLEASH_API_TOKEN
          ? { Authorization: UNLEASH_API_TOKEN }
          : undefined,
      });
    }
  }
  return client;
}
