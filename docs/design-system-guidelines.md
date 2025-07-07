# Design System Guidelines

This project uses **Panda CSS** with shadcn/ui components. Follow these principles when adding UI elements:

- **Prefer Panda's `css` function** and design tokens for styling new
  components.
- **Reference global CSS variables** defined in `src/app/globals.css` for colors
  and z-index values.
- **Favor shadcn/ui and Radix primitives** for interactive components like dialogs, dropdown menus and tooltips.
- Keep new components inside `src/components` and expose variant props so styles can be adjusted without editing CSS.
- Avoid direct `z-index` values; use the utility classes provided in `globals.css` (`z-nav`, `z-sticky`, etc.).

Following these rules keeps the design consistent and eliminates the need to touch raw CSS files.
