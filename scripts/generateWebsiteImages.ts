import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import OpenAI from "openai";
import sharp from "sharp";

dotenv.config();

const openai = new OpenAI();

interface ImageSpec {
  file: string;
  prompt: string;
  size?: string;
  width?: number;
  height?: number;
}

const specs: ImageSpec[] = [
  {
    file: "images/logo.png",
    prompt:
      "minimal logo reading 'Photo To Citation' with camera and ticket icon, dark background",
    size: "1024x1024",
    width: 40,
    height: 40,
  },
  {
    file: "images/hero.png",
    prompt:
      "cyclist snapping a photo of a car blocking the bike lane using a phone app",
    width: 800,
  },
];

const featurePrompts = [
  "camera icon for quick one-handed capture",
  "envelope icon for creating cases from email",
  "magnifying glass over car for automatic AI analysis",
  "map pin icon for reverse geocoding",
  "document icon for generating reports",
  "bell icon for multi-channel notifications",
  "clipboard icon for citation tracking",
  "group of cyclists helping each other",
];

for (let i = 0; i < featurePrompts.length; i++) {
  specs.push({
    file: `images/features/${i + 1}.png`,
    prompt: featurePrompts[i],
    size: "1024x1024",
    width: 64,
    height: 64,
  });
}

const libraryPrompts = [
  "car blocking bike lane while cyclist takes a photo",
  "sidewalk blocked by vehicle, pedestrian photographing",
  "cyclist using phone app to report violation",
  "car receiving citation from community program",
];

for (let i = 0; i < libraryPrompts.length; i++) {
  specs.push({
    file: `images/library/${i + 1}.png`,
    prompt: libraryPrompts[i],
    width: 180,
  });
}

specs.push({
  file: "images/owners.png",
  prompt: "vehicle owner looking sorry while paying fine for parking violation",
  width: 180,
});

function fetchRemote(file: string): Buffer | null {
  try {
    const data = execSync(`git show origin/gh-pages:website/${file}`, {
      encoding: "buffer",
    });
    return Buffer.from(data);
  } catch {
    return null;
  }
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

async function generate(spec: ImageSpec): Promise<void> {
  const localPath = path.join("website", spec.file);
  if (fs.existsSync(localPath)) return;
  const data = fetchRemote(spec.file);
  if (data) {
    await saveResized(localPath, data, spec);
    return;
  }
  const res = await openai.images.generate({
    model: "dall-e-3",
    prompt: spec.prompt,
    n: 1,
    size: spec.size || "1024x1024",
  });
  const url = res.data[0]?.url;
  if (!url) throw new Error("Image generation failed");
  const imgRes = await fetch(url);
  const buf = Buffer.from(await imgRes.arrayBuffer());
  await saveResized(localPath, buf, spec);
}

(async () => {
  try {
    execSync("git fetch origin gh-pages", { stdio: "ignore" });
  } catch {
    // ignore
  }
  for (const spec of specs) {
    await generate(spec);
  }
})();
