# Photo To Citation

Photo To Citation is an experimental app that helps residents of Oak Park, IL report vehicle violations that jeopardize pedestrian and non‑motorized safety. The goal is to take an uploaded photo of a violation and automatically produce a report that can be sent to the appropriate civil authorities. The system attempts to track each report until it becomes an official citation, even when that involves manual steps like mailing forms or payments.

## Tech Stack

The project uses a modern React stack while giving you full control over deployment. It can be self‑hosted using Docker or other custom infrastructure.

- ✅ **Next.js 14** (App Router with React Server Components)
- 🎨 **Tailwind CSS + shadcn/ui + Radix UI**
- 🧠 **Drizzle ORM with PostgreSQL**
- 🔄 **React Query (TanStack Query)** for client interactivity
- 🔐 **Lucia or NextAuth.js** for authentication
- ⚡ **Framer Motion** for animations
- 🧪 **Zod** for schema validation

This stack is designed for performance, type safety, and complete control over hosting and infrastructure.

## Folder Structure

```text
/app               # route handlers and React Server Components
  /components
    ClientComponent.tsx
    ServerComponent.tsx
/lib               # shared utilities such as database access
  db.ts
```

