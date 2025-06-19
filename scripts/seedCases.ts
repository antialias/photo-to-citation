import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { faker } from "@faker-js/faker";
import { Command } from "commander";
import dotenv from "dotenv";

import { analyzeCase } from "../src/lib/caseAnalysis";
import { createCase, updateCase } from "../src/lib/caseStore";
import { getLlm } from "../src/lib/llm";

dotenv.config();

const defaultScenarios = [
  "car blocking a bike lane during the day in an urban environment",
  "vehicle parked in front of a fire hydrant at night",
  "car double parked on a busy street",
  "truck obstructing a crosswalk at an intersection",
];

const program = new Command()
  .name("seedCases")
  .description("Generate mock violation cases for testing")
  .option("-c, --count <number>", "Number of cases to create", "4")
  .option(
    "-s, --scenario <prompt>",
    "Scenario prompt (can be repeated)",
    (v: string, p: string[]) => {
      p.push(v);
      return p;
    },
    [] as string[],
  )
  .option("-f, --scenarios-file <path>", "File containing scenario prompts")
  .option("--skip-analysis", "Skip analysis step")
  .option("--output-dir <dir>", "Directory under public for images", "mock")
  .option("--lat-range <min,max>", "Latitude range", "37.7,37.8")
  .option("--lon-range <min,max>", "Longitude range", "-122.5,-122.39")
  .option("--with-vin", "Include a random VIN")
  .option("--with-address", "Include a random street address")
  .option("--with-intersection", "Include a random intersection")
  .option("--model <model>", "OpenAI model for image generation", "dall-e-3")
  .option("--size <size>", "Image size", "1024x1024")
  .parse(process.argv);

const options = program.opts();

function parseRange(str: string): { min: number; max: number } {
  const [minStr, maxStr] = str.split(",");
  const min = Number.parseFloat(minStr);
  const max = Number.parseFloat(maxStr);
  if (Number.isNaN(min) || Number.isNaN(max)) {
    throw new Error(`Invalid range: ${str}`);
  }
  return { min, max };
}

const latRange = parseRange(options.latRange);
const lonRange = parseRange(options.lonRange);

let scenarios = options.scenario as string[];
if (options.scenariosFile) {
  const text = fs.readFileSync(options.scenariosFile, "utf8");
  scenarios = scenarios.concat(text.split(/\r?\n/).filter(Boolean));
}
if (scenarios.length === 0) scenarios = defaultScenarios;

const count = Number.parseInt(options.count, 10);

async function generateImage(prompt: string): Promise<string> {
  const { client } = getLlm("analyze_images");
  const result = await client.images.generate({
    prompt,
    model: options.model,
    n: 1,
    size: options.size,
  });
  const url = result.data?.[0]?.url;
  if (!url) throw new Error("No image URL returned");
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Failed to fetch image: ${resp.status}`);
  const buffer = Buffer.from(await resp.arrayBuffer());
  const fileName = `${crypto.randomUUID()}.png`;
  const filePath = path.join(
    process.cwd(),
    "public",
    options.outputDir,
    fileName,
  );
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, buffer);
  return path.join("/", options.outputDir, fileName);
}

async function seedCase(prompt: string): Promise<void> {
  const photo = await generateImage(prompt);
  const takenAt = faker.date.recent().toISOString();
  const gps = {
    lat: faker.location.latitude({ min: latRange.min, max: latRange.max }),
    lon: faker.location.longitude({ min: lonRange.min, max: lonRange.max }),
  };
  const c = createCase(photo, gps, crypto.randomUUID(), takenAt);
  const updates: Record<string, unknown> = {};
  if (options.withVin) updates.vin = faker.vehicle.vin();
  if (options.withAddress)
    updates.streetAddress = faker.location.streetAddress();
  if (options.withIntersection)
    updates.intersection = `${faker.location.street()} and ${faker.location.street()}`;
  if (Object.keys(updates).length > 0) updateCase(c.id, updates);
  if (!options.skipAnalysis) await analyzeCase(c);
  console.log(`Created case ${c.id} for scenario: ${prompt}`);
}

async function run(): Promise<void> {
  for (let i = 0; i < count; i++) {
    const prompt = scenarios[i % scenarios.length];
    await seedCase(prompt);
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
