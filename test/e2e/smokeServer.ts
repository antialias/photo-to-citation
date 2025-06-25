import os from "node:os";
import path from "node:path";

export const smokePort = 3050;

export const smokeEnv: NodeJS.ProcessEnv = {
  NEXTAUTH_SECRET: "secret",
  NODE_ENV: "test",
  SMTP_FROM: "test@example.com",
};

export function casesDb(filename = "cases.sqlite"): string {
  return path.join(os.tmpdir(), filename);
}
