import OpenAI from "openai";
import { config } from "./config";

export interface LlmProvider {
  id: string;
  apiKey: string;
  baseURL?: string;
}

export type LlmFeature =
  | "draft_email"
  | "analyze_images"
  | "ocr_paperwork"
  | "extract_info"
  | "lookup_code"
  | "profile_review";

function loadProviders(): Record<string, LlmProvider> {
  const list = config.LLM_PROVIDERS.split(/[,\s]+/);
  const map: Record<string, LlmProvider> = {};
  for (const name of list) {
    if (!name) continue;
    const key = name.trim();
    const upper = key.toUpperCase().replace(/-/g, "_");
    map[key] = {
      id: key,
      apiKey:
        (config as Record<string, string | undefined>)[`${upper}_API_KEY`] ||
        "",
      baseURL: (config as Record<string, string | undefined>)[
        `${upper}_BASE_URL`
      ],
    };
  }
  return map;
}

export const providers = loadProviders();
const clients: Record<string, OpenAI> = {};

function getClient(id: string): OpenAI {
  if (!clients[id]) {
    const p = providers[id];
    clients[id] = new OpenAI({
      apiKey: p.apiKey,
      baseURL: p.baseURL,
      dangerouslyAllowBrowser: true,
    });
  }
  return clients[id];
}

function toEnvKey(feature: LlmFeature): string {
  return feature.toUpperCase();
}

function getFeatureProvider(feature: LlmFeature): string {
  const env = (config as Record<string, string | undefined>)[
    `LLM_${toEnvKey(feature)}_PROVIDER`
  ];
  return env || "openai";
}

function getFeatureModel(feature: LlmFeature): string {
  const env = (config as Record<string, string | undefined>)[
    `LLM_${toEnvKey(feature)}_MODEL`
  ];
  return env || "gpt-4o";
}

export function getLlm(feature: LlmFeature): { client: OpenAI; model: string } {
  const providerId = getFeatureProvider(feature);
  const provider = providers[providerId];
  if (!provider) throw new Error(`Unknown provider ${providerId}`);
  const client = getClient(providerId);
  const model = getFeatureModel(feature);
  return { client, model };
}
