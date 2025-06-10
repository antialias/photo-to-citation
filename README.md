# Photo To Citation

Photo To Citation is an experimental app that helps residents of Oak Park, IL report vehicle violations that jeopardize pedestrian and non‑motorized safety. The goal is to take an uploaded photo of a violation and automatically produce a report that can be sent to the appropriate civil authorities. The system attempts to track each report until it becomes an official citation, even when that involves manual steps like mailing forms or payments.

## Tech Stack

- ✅ **Next.js 14** (App Router with React Server Components)
- 🎨 **Tailwind CSS + shadcn/ui + Radix UI**
- 🧠 **Drizzle ORM with PostgreSQL**
- 🔄 **React Query (TanStack Query)** for client interactivity
- 🔐 **Lucia or NextAuth.js** for authentication
- ⚡ **Framer Motion** for animations
- 🧪 **Zod** for schema validation
- 🖼️ **react-icons** for iconography

This stack is designed for performance, type safety, and complete control over hosting and infrastructure.

## Getting Started

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## OpenAI Integration

Create a `.env` file in the project root and add your API key:

```bash
OPENAI_API_KEY=your-key
```

The helper in `src/lib/openai.ts` uses this key to analyze uploaded violation
photos with OpenAI's vision model. It sends the image to the model and requests
a JSON response describing the violation. The JSON follows a schema that
includes the violation type, location clues, and vehicle details such as make,
model, color and license plate information.

When a user uploads a photo, the API stores the case immediately and then
triggers OpenAI analysis in the background. The resulting JSON is persisted
alongside the case record once the analysis completes, so uploads are never
blocked waiting for OpenAI.

If the uploaded image contains GPS EXIF data, the latitude and longitude are
extracted and saved with the case information.

## Folder Structure

```text
src/app           # route handlers and React Server Components
  components/
    ClientComponent.tsx
    ServerComponent.tsx
src/lib           # shared utilities such as database access
  db.ts
```

This repository contains only a basic scaffold; contributions are welcome.
