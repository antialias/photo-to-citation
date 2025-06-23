import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export function createBaseEnv(tmpDir: string): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = {
    NEXTAUTH_SECRET: "secret",
    NODE_ENV: "test",
    SMTP_FROM: "test@example.com",
    CASE_STORE_FILE: path.join(tmpDir, "cases.sqlite"),
    VIN_SOURCE_FILE: path.join(tmpDir, "vinSources.json"),
    OPENAI_BASE_URL: "http://localhost:9999",
    EMAIL_FILE: path.join(tmpDir, "emails.json"),
    SNAIL_MAIL_PROVIDER_FILE: path.join(tmpDir, "providers.json"),
    SNAIL_MAIL_FILE: path.join(tmpDir, "snailMail.json"),
    SNAIL_MAIL_OUT_DIR: path.join(tmpDir, "out"),
    RETURN_ADDRESS: "Your Name\n1 Main St\nCity, ST 12345",
    SNAIL_MAIL_PROVIDER: "file",
  };
  fs.writeFileSync(env.VIN_SOURCE_FILE, "[]");
  fs.writeFileSync(
    env.SNAIL_MAIL_PROVIDER_FILE,
    JSON.stringify([{ id: "file", active: true }]),
  );
  fs.writeFileSync(env.SNAIL_MAIL_FILE, "[]");
  fs.mkdirSync(env.SNAIL_MAIL_OUT_DIR, { recursive: true });
  return env;
}
