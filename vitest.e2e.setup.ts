import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { beforeAll } from "vitest";

// This setup script only ensures the Next.js build exists before tests run.

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
  if (fs.existsSync(".next")) return;
  await run(path.join("node_modules", ".bin", "next"), ["build", "--no-lint"], {
    NEXT_TELEMETRY_DISABLED: "1",
    NEXTAUTH_SECRET: "secret",
    NODE_ENV: "production",
    ...process.env,
  });
});
