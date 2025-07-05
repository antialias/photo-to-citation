# Capacitor Mobile Build Plan

This plan outlines how to add a Capacitor mobile app alongside the Next.js web project.
The goal is to reuse the core logic while compiling native iOS and Android binaries.

## 1. Structure

- Keep the existing web code under `src/`.
- Create a new `mobile/` folder for the Capacitor project.
- Use a shared `packages/` folder for UI components and utilities used by both the web and mobile apps.
- Declare each folder in a `pnpm-workspace.yaml` file so mobile and packages resolve correctly.

```text
repo/
├─ mobile/
│  ├─ capacitor.config.ts
│  ├─ ios/
│  └─ android/
├─ packages/
│  └─ ui/ (shared components)
└─ src/ (web)
```

## 2. Development

1. Inside `mobile/`, run `pnpm init` and install `@capacitor/core` and `@capacitor/cli`.
   Add `@capacitor/android` or `@capacitor/ios` depending on the platform.
2. Create `pnpm-workspace.yaml` in the repo root listing `mobile`, `packages/*`, and `src` as workspaces.
3. Configure `capacitor.config.ts` to point `webDir` at the production build from `packages/ui` or `src`.
4. Use `pnpm run build` from the repo root to generate web assets, then
   `pnpm --filter ./mobile capacitor copy` to sync them into the native projects.
5. For local testing, open the iOS or Android project folder and run the
   platform‑specific commands (`npx cap open ios`, `npx cap open android`).

## 3. Continuous Integration

- Add a separate job in the CI workflow that installs Capacitor dependencies and builds the native projects.
- The job can run in parallel with the existing Next.js build job.
- Run `pnpm --filter ./mobile capacitor copy` and the platform-specific build commands within that job.
- Artifacts from the mobile build should be stored for manual installation or further signing steps.

## 4. Benefits

- Reuse the same React components and data access code across web and mobile.
- Keep mobile-specific configuration isolated under `mobile/`.
- Parallel builds keep CI times reasonable and ensure the mobile app stays in sync with the web code.
