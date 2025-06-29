# i18n Hydration Issue

We noticed intermittent hydration warnings in production whenever the `I18nProvider` loaded resources asynchronously. The component sometimes returned `null` on the client until `i18n` finished initializing, which left the initial markup mismatched with the server render.

The fix is to load translations synchronously using `initImmediate: false` and to always render the provider on the client. `src/i18n.ts` creates an instance immediately and calls `initReactI18next` on first use. `I18nProvider` now initializes on every render if needed and never returns `null`.

A hydration test was added (`src/app/__tests__/hydration-i18n.test.tsx`) to ensure `hydrateRoot` completes without console errors when wrapping the tree with `I18nProvider`.
