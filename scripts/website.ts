import { execSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { Command } from "commander";
import {
  fetchRemote,
  gatherSpecs,
  generateImage,
} from "./generateWebsiteImages";

interface CliOptions {
  forceRegenerateImages?: string | boolean;
  generateNewVersions?: boolean;
  publish?: boolean;
}

function loadVersions(websiteDir: string): Record<string, number> {
  const p = path.join(websiteDir, "images", "versions.json");
  let data: string | null = null;
  if (fs.existsSync(p)) {
    data = fs.readFileSync(p, "utf8");
  }
  const remote = fetchRemote(websiteDir, path.join("images", "versions.json"));
  if (remote) {
    data = remote.toString("utf8");
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, data);
  }
  return data ? JSON.parse(data) : {};
}

function saveVersions(
  websiteDir: string,
  versions: Record<string, number>,
): void {
  const p = path.join(websiteDir, "images", "versions.json");
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(versions, null, 2));
}

async function publish(distDir: string): Promise<void> {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "gh-pages-"));
  execSync("git fetch origin gh-pages", { stdio: "inherit" });
  execSync(`git worktree add ${tmp} gh-pages`, { stdio: "inherit" });
  const dest = path.join(tmp, "website");
  fs.rmSync(dest, { recursive: true, force: true });
  fs.mkdirSync(dest, { recursive: true });
  execSync(`cp -r ${distDir}/. ${dest}`);
  execSync("git add .", { cwd: tmp, stdio: "inherit" });
  const status = spawnSync("git", ["status", "--porcelain"], { cwd: tmp });
  if (status.stdout.toString().trim()) {
    execSync('git commit -m "Update website"', { cwd: tmp, stdio: "inherit" });
    execSync("git push origin gh-pages", { cwd: tmp, stdio: "inherit" });
  }
  execSync(`git worktree remove ${tmp}`, { stdio: "inherit" });
}

(async () => {
  const program = new Command();
  program
    .option("--force-regenerate-images [tags]")
    .option("--generate-new-versions")
    .option("--publish");
  program.parse(process.argv);
  const opts = program.opts<CliOptions>();

  const websiteDir = process.env.WEBSITE_DIR || "website";
  const specs = gatherSpecs(websiteDir);
  const versions = loadVersions(websiteDir);

  let forceAll = false;
  let forceTags: Set<string> | null = null;
  if (opts.forceRegenerateImages) {
    if (typeof opts.forceRegenerateImages === "string") {
      forceTags = new Set(opts.forceRegenerateImages.split(","));
    } else {
      forceAll = true;
    }
  }

  for (const spec of specs) {
    const localPath = path.join(websiteDir, spec.file);
    const tag = spec.tag ?? spec.file;
    const version = spec.version ?? 0;
    const prevVersion = versions[tag] ?? 0;
    let shouldGenerate = false;
    if (forceAll) {
      shouldGenerate = true;
    } else if (forceTags && tag && forceTags.has(tag)) {
      shouldGenerate = true;
    } else if (opts.generateNewVersions && version > prevVersion) {
      shouldGenerate = true;
    } else if (!fs.existsSync(localPath)) {
      shouldGenerate = true;
    }

    if (shouldGenerate) {
      await generateImage(websiteDir, spec);
      versions[tag] = version;
    } else if (!fs.existsSync(localPath)) {
      const data = fetchRemote(websiteDir, spec.file);
      if (data) {
        await fs.promises.mkdir(path.dirname(localPath), { recursive: true });
        await fs.promises.writeFile(localPath, data);
      }
    }
  }

  saveVersions(websiteDir, versions);
  execSync("eleventy", { stdio: "inherit" });

  if (opts.publish) {
    await publish(path.join(websiteDir, "dist"));
  }
})();
