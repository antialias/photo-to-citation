import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import OpenAI from "openai";
import type { ImageGenerateParams } from "openai/resources/images";
import sharp from "sharp";

dotenv.config();

let openai: OpenAI | null = null;
function client(): OpenAI {
  if (!openai) openai = new OpenAI();
  return openai;
}

export interface ImageSpec {
  file: string;
  prompt: string;
  width?: number;
  height?: number;
  options: Record<string, unknown>;
}

function attrMap(tag: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const regex = /(\w[\w-]*)(?:=("[^"]*"|'[^']*'))?/g;
  let m: RegExpExecArray | null;
  for (;;) {
    m = regex.exec(tag);
    if (!m) break;
    const name = m[1];
    const val = m[2] ? m[2].slice(1, -1) : "";
    attrs[name] = val;
  }
  if (
    /(?:\s|^)data-image-gen(?:\s|>|$)/.test(tag) &&
    !("data-image-gen" in attrs)
  ) {
    attrs["data-image-gen"] = "";
  }
  return attrs;
}

export function parseSpecs(text: string): ImageSpec[] {
  const specs: ImageSpec[] = [];
  const imgRe = /<img[^>]*data-image-gen[^>]*>/g;
  let m: RegExpExecArray | null;
  for (;;) {
    m = imgRe.exec(text);
    if (!m) break;
    const tag = m[0];
    const attrs = attrMap(tag);
    const src = attrs.src;
    const alt = attrs.alt;
    if (!src || !alt) continue;
    let file = src;
    if (file.startsWith("{{")) {
      const match = file.match(/'([^']+)'/);
      if (match) file = match[1];
    }
    file = file.replace(/^\//, "");
    const width = attrs.width ? Number.parseInt(attrs.width, 10) : undefined;
    const height = attrs.height ? Number.parseInt(attrs.height, 10) : undefined;
    let options: Record<string, unknown> = {};
    if (attrs["data-image-gen"]?.trim()) {
      try {
        options = JSON.parse(attrs["data-image-gen"]);
      } catch {
        throw new Error(`Invalid JSON in data-image-gen for ${file}`);
      }
    }
    specs.push({ file, prompt: alt, width, height, options });
  }
  return specs;
}

function collectMarkdown(dir: string): string[] {
  const files: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      files.push(...collectMarkdown(path.join(dir, entry.name)));
    } else if (entry.name.endsWith(".md")) {
      files.push(path.join(dir, entry.name));
    }
  }
  return files;
}

export function collectSpecs(root: string): ImageSpec[] {
  const list: ImageSpec[] = [];
  const files = collectMarkdown(root);
  const seen = new Set<string>();
  for (const file of files) {
    const text = fs.readFileSync(file, "utf8");
    for (const spec of parseSpecs(text)) {
      if (!seen.has(spec.file)) {
        list.push(spec);
        seen.add(spec.file);
      }
    }
  }
  return list;
}

function fetchRemote(file: string): Buffer | null {
  const paths = [`website/${file}`, `website/dist/${file}`];
  for (const p of paths) {
    try {
      const data = execSync(`git show origin/gh-pages:${p}`, {
        encoding: "buffer",
      });
      return Buffer.from(data);
    } catch {
      // continue
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
  let w = spec.width;
  let h = spec.height;
  if (
    (w === undefined || h === undefined) &&
    typeof spec.options.size === "string"
  ) {
    const [sw, sh] = (spec.options.size as string)
      .split("x")
      .map((n) => Number.parseInt(n, 10));
    if (w === undefined) w = sw;
    if (h === undefined) h = sh;
  }
  const width = w ?? 1;
  const height = h ?? 1;
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

async function generate(spec: ImageSpec): Promise<void> {
  const localPath = path.join("website", spec.file);
  if (fs.existsSync(localPath)) return;
  const data = fetchRemote(spec.file);
  if (data) {
    await saveResized(localPath, data, spec);
    return;
  }
  const params: ImageGenerateParams & Record<string, unknown> = {
    model: "dall-e-3",
    prompt: spec.prompt,
    n: 1,
    ...spec.options,
  } as ImageGenerateParams & Record<string, unknown>;
  if (!params.size && spec.width && spec.height) {
    params.size = `${spec.width}x${spec.height}` as ImageGenerateParams["size"];
  }
  if (!process.env.OPENAI_API_KEY) {
    console.warn(
      `OPENAI_API_KEY not set; creating placeholder for ${spec.file}`,
    );
    await createPlaceholder(localPath, spec);
    return;
  }
  try {
    const res = await client().images.generate(params);
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

export async function run(rootDir: string): Promise<void> {
  try {
    execSync("git fetch origin gh-pages", { stdio: "ignore" });
  } catch {
    throw new Error("could not fetch gh-pages branch from origin");
  }
  const specs = collectSpecs(rootDir);
  for (const spec of specs) {
    await generate(spec);
  }
}

if (require.main === module) {
  run(path.resolve("website")).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
