# Design System Guidelines

This project relies on Tailwind CSS combined with shadcn/ui components to
minimize custom CSS. Follow these principles when adding UI elements:

- **Use Tailwind utilities** whenever possible instead of writing new CSS rules.
- **Reference global CSS variables** defined in `src/app/globals.css` for colors
  and z-index values.
- **Extend `tailwind.config.ts`** rather than editing global styles.
  Define custom colors, spacing, and fonts in the Tailwind theme.
- **Favor shadcn/ui and Radix primitives** for interactive components like dialogs, dropdown menus and tooltips.
- Keep new components inside `src/components` and expose variant props so styles can be adjusted without editing CSS.
- Avoid direct `z-index` values; use the utility classes provided in `globals.css` (`z-nav`, `z-sticky`, etc.).

Following these rules keeps the design consistent and eliminates the need to touch raw CSS files.
