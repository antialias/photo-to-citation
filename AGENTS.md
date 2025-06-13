# Root Agent Instructions

This repository is a Next.js TypeScript project using Vitest and Biome.

## Formatting and Linting
- Run `npm install` first to ensure the Biome CLI and other optional binaries are present.
- If Biome or Rollup binaries are missing after install, run:
  `npm install @biomejs/cli-linux-x64 @rollup/rollup-linux-x64-gnu`.
- Run `npm run format` before committing to apply Biome's auto-formatting.
- Ensure `npm run lint` completes with no errors or warnings.

## Testing
- Run `npm test` after linting. All tests should pass before you commit.
- Write end-to-end tests for important flows so the application can be verified
  as a whole.
- Re-run the end-to-end tests whenever you modify the codebase to catch
  regressions early.

## Code Style
- Use 2‑space indentation and double quotes for strings.
- Terminate statements with semicolons.
- Import Node.js builtin modules using the `node:` protocol (e.g. `import fs from "node:fs";`).

## Dates and Times
- Parse and store timestamps in UTC ISO format.
- Avoid formatting dates on the server. Let the client format and display dates
  using `toLocaleString` with the browser's locale.

## Next.js Dynamic APIs
- Type `params` and `searchParams` as `Promise` objects and `await` them before using their properties.

## Commit Messages
- Use short commit summaries starting with a type such as `feat:`, `fix:`, or `chore:` followed by a concise description.

## Generated Files
- Files under `src/generated` are created by scripts. **Never** edit them manually.

