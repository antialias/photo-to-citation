import { spawn } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll } from "vitest";

interface ServerInfo {
  port: number;
  url: string;
  close: () => Promise<void>;
}

declare global {
  // eslint-disable-next-line no-var
  var __E2E_SERVER__: ServerInfo | undefined;
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

async function run(
  cmd: string,
  args: string[],
  env?: NodeJS.ProcessEnv,
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const proc = spawn(cmd, args, { stdio: "inherit", env });
    proc.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} ${args.join(" ")} exited with ${code}`));
    });
  });
}

beforeAll(async () => {
  if (global.__E2E_SERVER__) return;
  if (!fs.existsSync(".next")) {
    await run(
      path.join("node_modules", ".bin", "next"),
      ["build", "--no-lint"],
      {
        NEXT_TELEMETRY_DISABLED: "1",
        NEXTAUTH_SECRET: "secret",
        NODE_ENV: "production",
        ...process.env,
      },
    );
  }

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "e2e-"));
  const env = {
    ...process.env,
    NEXT_TELEMETRY_DISABLED: "1",
    TEST_APIS: "1",
    NODE_ENV: "test",
    NEXTAUTH_URL: "http://localhost",
    NEXTAUTH_SECRET: "secret",
    CASE_STORE_FILE: path.join(tmpDir, "cases.sqlite"),
    CI: "1",
  } as NodeJS.ProcessEnv;

  const proc = spawn(
    path.join("node_modules", ".bin", "next"),
    ["start", "-p", "0"],
    {
      env,
      stdio: ["ignore", "pipe", "pipe"],
    },
  );

  let port: number | undefined;
  const parse = (data: Buffer) => {
    const m = data.toString().match(/localhost:(\d+)/);
    if (m) port = Number(m[1]);
  };
  proc.stdout.on("data", parse);
  proc.stderr.on("data", parse);

  await new Promise<void>((resolve, reject) => {
    const check = () => {
      if (port) {
        waitForServer(port).then(resolve);
      } else if (proc.exitCode != null) {
        reject(new Error("next start failed"));
      } else {
        setTimeout(check, 100);
      }
    };
    check();
  });

  if (!port) throw new Error("Server port not found");
  const serverPort = port;
  global.__E2E_SERVER__ = {
    port: serverPort,
    url: `http://localhost:${serverPort}`,
    close: () =>
      new Promise((resolve) => {
        proc.once("exit", () => resolve());
        proc.kill();
      }),
  };
}, 120000);

afterAll(async () => {
  if (global.__E2E_SERVER__) {
    await global.__E2E_SERVER__?.close();
    global.__E2E_SERVER__ = undefined;
  }
});
