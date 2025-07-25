import path from "node:path";
import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z
  .object({
    OPENAI_API_KEY: z.string().optional(),
    OPENAI_BASE_URL: z.string().optional(),
    LLM_PROVIDERS: z.string().default("openai"),
    LLM_DRAFT_EMAIL_MODEL: z.string().default("gpt-4o"),
    LLM_DRAFT_EMAIL_PROVIDER: z.string().default("openai"),
    LLM_ANALYZE_IMAGES_MODEL: z.string().default("gpt-4o"),
    LLM_ANALYZE_IMAGES_PROVIDER: z.string().default("openai"),
    LLM_OCR_PAPERWORK_MODEL: z.string().default("gpt-4o"),
    LLM_OCR_PAPERWORK_PROVIDER: z.string().default("openai"),
    LLM_EXTRACT_INFO_MODEL: z.string().default("gpt-4o"),
    LLM_EXTRACT_INFO_PROVIDER: z.string().default("openai"),
    GOOGLE_MAPS_API_KEY: z.string().optional(),
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: z.string().optional(),
    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.coerce.number().optional(),
    SMTP_SECURE: z.coerce.boolean().optional(),
    SMTP_USER: z.string().optional(),
    SMTP_PASS: z.string().optional(),
    SMTP_FROM: z.string().optional(),
    MOCK_EMAIL_TO: z.string().optional(),
    EMAIL_FILE: z.string().optional(),
    SUPER_ADMIN_EMAIL: z.string().optional(),
    NEXTAUTH_SECRET: z.string().optional(),
    NEXTAUTH_URL: z.string().optional(),
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    FACEBOOK_CLIENT_ID: z.string().optional(),
    FACEBOOK_CLIENT_SECRET: z.string().optional(),
    CASE_STORE_FILE: z.string().optional(),
    VIN_SOURCE_FILE: z.string().optional(),
    OWNERSHIP_MODULE_FILE: z.string().optional(),
    SNAIL_MAIL_FILE: z.string().optional(),
    SNAIL_MAIL_PROVIDER_FILE: z.string().optional(),
    OAUTH_PROVIDER_FILE: z.string().optional(),
    RETURN_ADDRESS: z.string().optional(),
    SNAIL_MAIL_PROVIDER: z.string().default("mock"),
    SNAIL_MAIL_OUT_DIR: z.string().optional(),
    CHECK_ACCOUNT_NUMBER: z.string().optional(),
    CHECK_ROUTING_NUMBER: z.string().optional(),
    TWILIO_ACCOUNT_SID: z.string().optional(),
    TWILIO_AUTH_TOKEN: z.string().optional(),
    TWILIO_FROM_NUMBER: z.string().optional(),
    DOCSMIT_BASE_URL: z.string().optional(),
    DOCSMIT_EMAIL: z.string().optional(),
    DOCSMIT_PASSWORD: z.string().optional(),
    DOCSMIT_SOFTWARE_ID: z.string().optional(),
    IMAP_HOST: z.string().optional(),
    IMAP_PORT: z.coerce.number().optional(),
    IMAP_USER: z.string().optional(),
    IMAP_PASS: z.string().optional(),
    IMAP_TLS: z.coerce.boolean().default(true),
    INBOX_STATE_FILE: z.string().optional(),
    UPLOAD_DIR: z.string().default("uploads"),
    NEXT_PUBLIC_BROWSER_DEBUG: z.coerce.boolean().default(false),
    NEXT_PUBLIC_BASE_PATH: z.string().default(""),
    UNLEASH_URL: z.string().optional(),
    UNLEASH_API_TOKEN: z.string().optional(),
    NEXT_PUBLIC_UNLEASH_PROXY_URL: z.string().optional(),
    NEXT_PUBLIC_UNLEASH_CLIENT_KEY: z.string().optional(),
    NEXT_PUBLIC_APP_VERSION: z.string().optional(),
    NEXT_PUBLIC_APP_COMMIT: z.string().optional(),
    NEXT_PUBLIC_DEPLOY_TIME: z.string().optional(),
  })
  .passthrough();

export type Config = z.infer<typeof envSchema>;
export function getConfig(): Config {
  const cfg = envSchema.parse(process.env);
  if (cfg.MOCK_EMAIL_TO === "") cfg.MOCK_EMAIL_TO = undefined;
  return cfg;
}
// For NEXT_PUBLIC_* variables we must reference them directly so Next.js can
// inline them for client-side usage. When using the dev server a full page
// reload may be required to pick up changes.
export const config: Config = {
  ...getConfig(),
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
  NEXT_PUBLIC_BROWSER_DEBUG: process.env.NEXT_PUBLIC_BROWSER_DEBUG === "true",
  NEXT_PUBLIC_BASE_PATH: process.env.NEXT_PUBLIC_BASE_PATH || "",
  NEXT_PUBLIC_UNLEASH_PROXY_URL: process.env.NEXT_PUBLIC_UNLEASH_PROXY_URL,
  NEXT_PUBLIC_UNLEASH_CLIENT_KEY: process.env.NEXT_PUBLIC_UNLEASH_CLIENT_KEY,
  UNLEASH_URL: process.env.UNLEASH_URL,
  UNLEASH_API_TOKEN: process.env.UNLEASH_API_TOKEN,
  NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION,
  NEXT_PUBLIC_APP_COMMIT: process.env.NEXT_PUBLIC_APP_COMMIT,
  NEXT_PUBLIC_DEPLOY_TIME: process.env.NEXT_PUBLIC_DEPLOY_TIME,
};
config.UPLOAD_DIR = path.resolve(config.UPLOAD_DIR);
