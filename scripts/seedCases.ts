import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { faker } from "@faker-js/faker";
import dotenv from "dotenv";

import { analyzeCase } from "../src/lib/caseAnalysis";
import { createCase } from "../src/lib/caseStore";
import { getLlm } from "../src/lib/llm";

dotenv.config();

const scenarios = [
  "car blocking a bike lane during the day in an urban environment",
  "vehicle parked in front of a fire hydrant at night",
  "car double parked on a busy street",
  "truck obstructing a crosswalk at an intersection",
];

async function generateImage(prompt: string): Promise<string> {
  const { client } = getLlm("analyze_images");
  const result = await client.images.generate({
    prompt,
    model: "dall-e-3",
    n: 1,
    size: "1024x1024",
  });
  const url = result.data?.[0]?.url;
  if (!url) throw new Error("No image URL returned");
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Failed to fetch image: ${resp.status}`);
  const buffer = Buffer.from(await resp.arrayBuffer());
  const fileName = `${crypto.randomUUID()}.png`;
  const filePath = path.join(process.cwd(), "public", "mock", fileName);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, buffer);
  return path.join("/mock", fileName);
}

async function seedCase(prompt: string): Promise<void> {
  const photo = await generateImage(prompt);
  const takenAt = faker.date.recent().toISOString();
  const gps = {
    lat: Number.parseFloat(faker.location.latitude({ min: 37.7, max: 37.8 })),
    lon: Number.parseFloat(
      faker.location.longitude({ min: -122.5, max: -122.39 }),
    ),
  };
  const c = createCase(photo, gps, crypto.randomUUID(), takenAt);
  await analyzeCase(c);
  console.log(`Created case ${c.id} for scenario: ${prompt}`);
}

async function run(): Promise<void> {
  for (const scenario of scenarios) {
    await seedCase(scenario);
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
