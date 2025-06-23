// @vitest-environment node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { type OpenAIImageStub, startOpenAIImageStub } from "./openaiImageStub";

const nodeBin = process.execPath;
const script = path.resolve("scripts/generateWebsiteImages.ts");
const tsNodeReg = require.resolve("ts-node/register/transpile-only");
const tsconfig = path.resolve("tsconfig.json");

function run(cwd: string, env: NodeJS.ProcessEnv) {
  return require("node:child_process").spawnSync(
    nodeBin,
    ["-r", tsNodeReg, script],
    {
      cwd,
      env: { ...process.env, TS_NODE_PROJECT: tsconfig, ...env },
      encoding: "utf8",
    },
  );
}

describe("generateWebsiteImages", () => {
  let tmpDir: string;
  let stub: OpenAIImageStub;

  beforeAll(async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "website-"));
    fs.mkdirSync(path.join(tmpDir, "website"));
    fs.writeFileSync(
      path.join(tmpDir, "website", "index.md"),
      '<img src="img.png" alt="a cat" width="32" height="32" data-image-gen />\n',
    );
    stub = await startOpenAIImageStub();
    const res = run(tmpDir, {
      OPENAI_API_KEY: "sk-test",
      OPENAI_BASE_URL: stub.url,
    });
    expect(res.status).toBe(0);
  });

  afterAll(async () => {
    await stub.close();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("sends generation request and saves image", () => {
    expect(stub.requests).toHaveLength(1);
    const body = stub.requests[0].body as { prompt: string; size: string };
    expect(body.prompt).toBe("a cat");
    expect(body.size).toBe("32x32");
    const imgPath = path.join(tmpDir, "website", "img.png");
    expect(fs.existsSync(imgPath)).toBe(true);
  });
});
