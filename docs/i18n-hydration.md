# i18n Hydration Issues

When the client initializes i18n asynchronously, React may render the first frame before translations are available. This led to occasional hydration mismatches where the server output used one language but the client rendered another. Synchronous initialization (using `initImmediate: false`) ensures resources load before the first render so the DOM matches on both server and client.

The `I18nProvider` now calls `initI18n` directly on first render instead of waiting inside an effect. Hydration is verified by `src/app/__tests__/hydration-i18n.test.tsx`, which wraps the component tree in `I18nProvider`.
