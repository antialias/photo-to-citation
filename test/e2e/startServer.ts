import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import http from "node:http";
import os from "node:os";
import path from "node:path";

export interface TestServer {
  url: string;
  close: () => Promise<void>;
}

function waitForServer(port: number): Promise<void> {
  return new Promise((resolve) => {
    const attempt = () => {
      http
        .get(`http://localhost:${port}`, () => resolve())
        .on("error", () => setTimeout(attempt, 200));
    };
    attempt();
  });
}

export async function startServer(
  port = 0,
  env: Partial<NodeJS.ProcessEnv> = {},
): Promise<TestServer> {
  const nextBin = path.join("node_modules", ".bin", "next");
  // Using EMAIL_FILE activates the mock email store defined in src/lib/email.ts
  // so no real messages are sent during tests.
  const emailFile =
    env.EMAIL_FILE ?? path.join(os.tmpdir(), `e2e-emails-${randomUUID()}.json`);
  const proc = spawn(nextBin, ["dev", "-p", String(port), "--turbo"], {
    env: {
      ...process.env,
      NEXT_TELEMETRY_DISABLED: "1",
      NEXT_DISABLE_ESLINT: "1",
      NODE_ENV: env.NODE_ENV ?? "test",
      TEST_APIS: "1",
      NEXTAUTH_URL: `http://localhost:${port}`,
      SUPER_ADMIN_EMAIL: "",
      SMTP_HOST: "",
      SMTP_PORT: "",
      SMTP_SECURE: "",
      SMTP_USER: "",
      SMTP_PASS: "",
      SMTP_FROM: "",
      EMAIL_FILE: emailFile,
      MOCK_EMAIL_TO: "",
      ...env,
      CI: "1",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let output = "";
  proc.stdout.on("data", (c) => {
    console.log(String(c));
    output += String(c);
  });
  proc.stderr.on("data", (c) => {
    console.log(String(c));
    output += String(c);
  });

  const actualPort = await (async () => {
    if (port !== 0) return port;
    return await new Promise<number>((resolve) => {
      const check = (chunk: Buffer) => {
        const match = /localhost:(\d+)/.exec(String(chunk));
        if (match) {
          proc.stdout.off("data", check);
          resolve(Number(match[1]));
        }
      };
      proc.stdout.on("data", check);
    });
  })();

  await waitForServer(actualPort);
  return {
    url: `http://localhost:${actualPort}`,
    close: () =>
      new Promise((resolve) => {
        proc.once("exit", (code) => {
          if (code !== 0) process.stdout.write(output);
          resolve();
        });
        proc.kill();
      }),
  };
}
