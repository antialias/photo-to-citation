import { spawn } from "node:child_process";
import http from "node:http";
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
  port = 3002,
  env: Partial<NodeJS.ProcessEnv> = {},
): Promise<TestServer> {
  const nextBin = path.join("node_modules", ".bin", "next");
  const proc = spawn(nextBin, ["dev", "-p", String(port)], {
    env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1", ...env, CI: "1" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let output = "";
  proc.stdout.on("data", (c) => {
    output += String(c);
  });
  proc.stderr.on("data", (c) => {
    output += String(c);
  });
  await waitForServer(port);
  return {
    url: `http://localhost:${port}`,
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
