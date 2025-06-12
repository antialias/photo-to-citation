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
  env: NodeJS.ProcessEnv = {},
): Promise<TestServer> {
  const nextBin = path.join("node_modules", ".bin", "next");
  const proc = spawn(nextBin, ["dev", "-p", String(port)], {
    env: { ...process.env, ...env, CI: "1" },
    stdio: "inherit",
  });
  await waitForServer(port);
  return {
    url: `http://localhost:${port}`,
    close: () =>
      new Promise((resolve) => {
        proc.once("exit", () => resolve());
        proc.kill();
      }),
  };
}
