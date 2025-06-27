import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import dotenv from "dotenv";
import jsdom from "jsdom";

const { JSDOM } = jsdom;
import OpenAI from "openai";
import type { ImageGenerateParams } from "openai/resources/images";
import sharp from "sharp";

dotenv.config();

export interface ImageSpec {
  file: string;
  width?: number;
  height?: number;
  args: ImageGenerateParams;
}

function parseSrc(value: string): string {
  const trimmed = value.trim();
  if (trimmed.startsWith("{{")) {
    const m = trimmed.match(/['"]([^'"]+)['"]/);
    if (m) return m[1].replace(/^\//, "");
  }
  return trimmed.replace(/^\//, "");
}

export function gatherSpecs(dir: string): ImageSpec[] {
  const specs: Record<string, ImageSpec> = {};
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const f of files) {
    const fp = path.join(dir, f.name);
    if (f.isDirectory()) {
      for (const spec of gatherSpecs(fp)) {
        specs[spec.file] = spec;
      }
      continue;
    }
    if (!f.name.endsWith(".md") && !f.name.endsWith(".njk")) continue;
    const content = fs.readFileSync(fp, "utf8");
    const dom = new JSDOM(content);
    const imgs = dom.window.document.querySelectorAll("img[data-image-gen]");
    for (const img of imgs) {
      const srcAttr = img.getAttribute("src") || "";
      const file = parseSrc(srcAttr);
      const alt = img.getAttribute("alt") || "";
      const widthAttr = img.getAttribute("width");
      const heightAttr = img.getAttribute("height");
      const width = widthAttr ? Number.parseInt(widthAttr, 10) : undefined;
      const height = heightAttr ? Number.parseInt(heightAttr, 10) : undefined;
      const data = img.getAttribute("data-image-gen") || "";
      let opts: Partial<ImageGenerateParams> = {};
      if (data.trim()) {
        try {
          opts = JSON.parse(data);
        } catch {
          console.warn(`could not parse JSON for ${file}`);
        }
      }
      const args: ImageGenerateParams = {
        model: "dall-e-3",
        prompt: alt,
        n: 1,
        ...opts,
      };
      if (!opts.size && width && height) {
        args.size = `${width}x${height}` as ImageGenerateParams["size"];
      }
      specs[file] = { file, width, height, args };
    }
  }
  return Object.values(specs);
}

function fetchRemote(dir: string, file: string): Buffer | null {
  const paths = [path.join(dir, file), path.join(dir, "dist", file)];
  for (const p of paths) {
    try {
      const data = execSync(`git show origin/gh-pages:${p}`, {
        encoding: "buffer",
      });
      return Buffer.from(data);
    } catch {
      // ignore
    }
  }
  return null;
}

async function saveResized(
  localPath: string,
  buf: Buffer,
  spec: ImageSpec,
): Promise<void> {
  let output = buf;
  if (spec.width || spec.height) {
    output = await sharp(buf)
      .resize(spec.width, spec.height, { fit: "inside" })
      .toBuffer();
  }
  fs.mkdirSync(path.dirname(localPath), { recursive: true });
  fs.writeFileSync(localPath, output);
}

async function createPlaceholder(
  localPath: string,
  spec: ImageSpec,
): Promise<void> {
  const width = spec.width ?? 1;
  const height = spec.height ?? 1;
  const buf = await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .png()
    .toBuffer();
  await saveResized(localPath, buf, spec);
}

async function generate(websiteDir: string, spec: ImageSpec): Promise<void> {
  const openai = new OpenAI();
  const localPath = path.join(websiteDir, spec.file);
  if (fs.existsSync(localPath)) return;
  const data = fetchRemote(websiteDir, spec.file);
  if (data) {
    await saveResized(localPath, data, spec);
    return;
  }
  if (!process.env.OPENAI_API_KEY) {
    console.warn(
      `OPENAI_API_KEY not set; creating placeholder for ${spec.file}`,
    );
    await createPlaceholder(localPath, spec);
    return;
  }
  try {
    const res = await openai.images.generate(spec.args);
    const url = res.data?.[0]?.url;
    if (!url) throw new Error("Image generation failed");
    const imgRes = await fetch(url);
    const buf = Buffer.from(await imgRes.arrayBuffer());
    await saveResized(localPath, buf, spec);
  } catch (err) {
    console.error(`Image generation failed for ${spec.file}`, err);
    await createPlaceholder(localPath, spec);
  }
}

if (require.main === module) {
  (async () => {
    const websiteDir = process.env.WEBSITE_DIR || "website";
    try {
      execSync("git fetch origin gh-pages", { stdio: "ignore" });
    } catch {
      throw new Error("could not fetch gh-pages branch from origin");
    }
    const specs = gatherSpecs(websiteDir);
    for (const spec of specs) {
      await generate(websiteDir, spec);
    }
  })();
}
