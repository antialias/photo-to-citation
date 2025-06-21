import fs from "node:fs";
import path from "node:path";

const DEFAULT_KEEP = 10;
const migrationsDir = path.join(process.cwd(), "migrations");

function usage(): void {
  console.log(`Usage: npm run squash:migrations -- [options]

Squash old migration files into a single baseline migration.

Options:
  --keep <n>  Number of latest migrations to keep (default ${DEFAULT_KEEP})
  --help      Show this help message
`);
}

function parseArgs(): number {
  const args = process.argv.slice(2);
  let keep = DEFAULT_KEEP;
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--help") {
      usage();
      process.exit(0);
    } else if (arg === "--keep") {
      const value = args[i + 1];
      if (!value) {
        console.error("--keep requires a number");
        process.exit(1);
      }
      keep = Number.parseInt(value, 10);
      if (Number.isNaN(keep) || keep < 0) {
        console.error("Invalid keep value");
        process.exit(1);
      }
      i++;
    } else {
      console.error(`Unknown argument: ${arg}`);
      usage();
      process.exit(1);
    }
  }
  return keep;
}

function main(): void {
  const keep = parseArgs();
  fs.mkdirSync(migrationsDir, { recursive: true });
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  if (files.length <= keep) {
    console.log("No migrations to squash");
    return;
  }

  const toSquash = files.slice(0, files.length - keep);
  const baselineParts = toSquash.map((f) => {
    const content = fs.readFileSync(path.join(migrationsDir, f), "utf8");
    return `-- ${f}\n${content.trim()}\n`;
  });
  const baseline = baselineParts.join("\n");
  const baselinePath = path.join(migrationsDir, "0000_baseline.sql");
  fs.writeFileSync(baselinePath, `${baseline}\n`);

  for (const f of toSquash) {
    fs.unlinkSync(path.join(migrationsDir, f));
  }

  console.log(
    `Squashed ${toSquash.length} migrations into ${path.basename(baselinePath)}`,
  );
}

main();
