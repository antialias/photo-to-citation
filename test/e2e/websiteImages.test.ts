// @vitest-environment node
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { startImageStub } from "./imageStub";

const nodeBin = process.execPath;
const tsNodeReg = require.resolve("ts-node/register/transpile-only");
const scriptPath = path.resolve("scripts/generateWebsiteImages.ts");
const tsconfig = path.resolve("tsconfig.json");

function run(cwd: string, env: NodeJS.ProcessEnv) {
  return spawnSync(nodeBin, ["-r", tsNodeReg, scriptPath], {
    cwd,
    env: { ...process.env, TS_NODE_PROJECT: tsconfig, ...env },
    encoding: "utf8",
  });
}

describe("generateWebsiteImages", () => {
  it("calls OpenAI with args from markdown", async () => {
    const stub = await startImageStub();
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "website-"));
    const site = path.join(dir, "site");
    fs.mkdirSync(site);
    fs.writeFileSync(
      path.join(site, "index.md"),
      `<img src="autogen/test.png" alt="a prompt" width="20" height="40" data-image-gen='{"model":"gpt-image-1","size":"64x64"}' />`,
    );
    const res = run(dir, {
      WEBSITE_DIR: site,
      OPENAI_API_KEY: "x",
      OPENAI_BASE_URL: stub.url,
    });
    expect(res.status).toBe(0);
    expect(stub.requests.length).toBe(1);
    const body = stub.requests[0].body as Record<string, string>;
    expect(body.model).toBe("gpt-image-1");
    expect(body.size).toBe("64x64");
    expect(fs.existsSync(path.join(site, "autogen/test.png"))).toBe(true);
    await stub.close();
    fs.rmSync(dir, { recursive: true, force: true });
  });
});
