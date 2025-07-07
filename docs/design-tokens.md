# Design Tokens

This project uses Panda CSS to manage design tokens. The tokens live in the generated directory `styled-system/tokens`.
You can pull token values into components with Panda's `token` function:

```ts
import { token } from "styled-system/tokens";

const styles = {
  heading: {
    fontSize: token("fontSizes.xl"),
    color: token("colors.blue.600"),
  },
};
```

Run `pnpm run panda` whenever you change tokens so the `styled-system` directory
contains the latest CSS variables.

When Panda runs it converts the tokens to CSS variables inside `styled-system/styles.css`.
Many values map back to variables declared in `src/app/globals.css` such as
`--color-background`, `--color-foreground` and the z-index utilities (`--z-nav`, `--z-sticky`, etc.).
Updating those variables will cascade through the tokens so components stay in sync.

Available token categories include colors, font sizes, spacing, radii and shadows.
See `styled-system/tokens/index.mjs` for the complete list.
