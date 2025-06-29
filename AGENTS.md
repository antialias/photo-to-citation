# Root Agent Instructions

This repository is a Next.js TypeScript project using Vitest and Biome.

## Formatting and Linting

- Run `npm install` first to ensure the Biome CLI and other optional binaries are present.
- If Biome or Rollup binaries are missing after install, run:
  `npm install @biomejs/cli-linux-x64 @rollup/rollup-linux-x64-gnu`.
- Run `npm run format` before committing to apply Biome's auto-formatting.
- Ensure `npm run lint` completes with no errors or warnings.
- If you edited any Markdown files, run `npm run lint:md` to check them before completing the task.
- Do not introduce any new TypeScript errors. If you can quickly fix an error
  without side effects, include that fix in the same task.

## Testing

- Run `npm test` after linting. All tests should pass before you commit.
- Write end-to-end tests for important flows so the application can be verified
  as a whole.
- Re-run the end-to-end tests whenever you modify the codebase to catch
  regressions early.
- When tests fail, fix the application code if it contains a real bug.
  Do not adjust the application just to satisfy a faulty test, and do not
  modify test code to accept incorrect behavior from the app.
- No task is complete unless all `e2e:smoke` tests pass. Ideally, run the
  entire e2e suite and ensure it passes as well.

## Code Style

- Use 2‑space indentation and double quotes for strings.
- Terminate statements with semicolons.
- Import Node.js builtin modules using the `node:` protocol (e.g. `import fs from "node:fs";`).

## Front-end Best Practices

- Use `z-index` only as a last resort when other layering techniques fail. If
  a `z-index` is necessary, reference a variable declared elsewhere so elements
  can maintain relative stacking within the same context.

## Dates and Times

- Parse and store timestamps in UTC ISO format.
- Avoid formatting dates on the server. Let the client format and display dates
  using `toLocaleString` with the browser's locale.

## Next.js Dynamic APIs

- Type `params` and `searchParams` as `Promise` objects and `await` them before using their properties.

## Commit Messages

- Follow [Semantic Commit Messages](https://www.conventionalcommits.org/) so tooling can infer semantic versions.
- Example summaries:
  - `feat: add user login page`
  - `fix: correct signup API error`
  - `docs: update installation guide`
  - `chore: update dependencies`
  - `refactor: improve caching logic`

## Generated Files

- Files under `src/generated` are created by scripts. **Never** edit them manually.
