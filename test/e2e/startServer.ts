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

export async function startServer(port = 3002): Promise<TestServer> {
  const nextBin = path.join("node_modules", ".bin", "next");

  await new Promise<void>((resolve, reject) => {
    const build = spawn(nextBin, ["build", "--no-lint"], {
      env: { ...process.env, CI: "1", NEXT_DISABLE_ESLINT: "1" },
      stdio: "inherit",
    });
    build.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`build failed: ${code}`));
    });
  });

  const proc = spawn(nextBin, ["start", "-p", String(port)], {
    env: { ...process.env, CI: "1", NEXT_DISABLE_ESLINT: "1" },
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
