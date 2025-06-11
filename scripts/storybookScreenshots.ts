import { execSync } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { createServer } from "node:http";
import puppeteer from "puppeteer";
import handler from "serve-handler";

async function serve(dir: string, port: number) {
  const server = createServer((req, res) => {
    void handler(req, res, { public: dir });
  });
  await new Promise<void>((resolve) => server.listen(port, resolve));
  return server;
}

async function run() {
  execSync("npm run build-storybook", {
    stdio: "inherit",
    env: {
      ...process.env,
      CI: "1",
      STORYBOOK_DISABLE_TELEMETRY: "1",
      CSS_TRANSFORMER_WASM: "1",
    },
  });
  const port = 6007;
  const server = await serve("storybook-static", port);
  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  const response = await page.goto(`http://localhost:${port}/index.json`);
  const data = await response?.json();
  await mkdir("storybook-screenshots", { recursive: true });
  for (const id of Object.keys(data.entries)) {
    await page.goto(`http://localhost:${port}/iframe.html?id=${id}`, {
      waitUntil: "networkidle0",
    });
    await page.screenshot({ path: `storybook-screenshots/${id}.png` });
  }
  await browser.close();
  server.close();
  execSync("rm -rf storybook-static");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
