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

Use [`Biome`](https://biomejs.dev/) for consistent formatting and linting:

```bash
npm run lint
npm run format
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Generating Zod Schemas

When interfaces in `src/lib` change, update the runtime schemas with:

```bash
npm run generate:schemas
```

The command uses `ts-to-zod` with `ts-to-zod.config.js` to write schemas under `src/generated/zod`.

## OpenAI Integration

Create a `.env` file in the project root and add your API key:

```bash
OPENAI_API_KEY=your-key
```

The helper in `src/lib/openai.ts` uses this key to analyze uploaded violation
photos with OpenAI's vision model. It sends the image to the model and requests
a JSON response describing the violation. The response is validated with Zod to
ensure it matches the expected schema. If validation fails, the helper retries
the request, providing the previous response and error to guide the model. The
JSON schema includes the violation type, location clues, and vehicle details
such as make, model, color and license plate information.

`ocrPaperwork` uses the same client to transcribe public paperwork images. It
returns the full transcription exactly as it appears. After generating this raw
text, the helper sends it back to the LLM with a JSON schema requesting contact
information for the registered owner, VIN, registration status, license plate
details and any calls to action. The extraction schema mirrors fields from the
image analysis so the resulting `PaperworkInfo` object fits alongside the
violation report data.

When a user uploads a photo, the API stores the case immediately and then
triggers OpenAI analysis in the background. These asynchronous tasks are
managed by [Bree](https://github.com/breejs/bree), which spawns worker threads
to handle image analysis and reverse geocoding. The resulting JSON is persisted
alongside the case record once the analysis completes, so uploads are never
blocked waiting for OpenAI.

If a case ends up without analysis or the last attempt failed with a retryable
error code, you can trigger a new pass with:

```bash
npm run reanalyze
```
This command scans stored cases and reprocesses any that meet the retry
criteria.

If analysis fails, the case page shows a red error message explaining why.
Common issues include the AI response being cut off, invalid JSON, or not
matching the expected schema. In most cases you can simply retry the analysis.
If the problem persists, contact the project maintainers for help.

If the uploaded image contains GPS EXIF data, the latitude and longitude are
extracted and saved with the case information.

If a `GOOGLE_MAPS_API_KEY` is provided in `.env`, the app also performs a
reverse geocode lookup for each case in the background. The resulting street
address and closest intersection are stored with the case once the lookup
completes.

## Email Sending

To enable sending reports directly from the app, configure SMTP credentials in
your `.env` file:

```bash
SMTP_HOST=localhost
SMTP_PORT=587
SMTP_USER=username
SMTP_PASS=password
SMTP_FROM=from@example.com
# Send all mail to this address instead of the real authority
MOCK_EMAIL_TO=test@example.com
```

If `MOCK_EMAIL_TO` is set, all outgoing email will be directed there instead of
the authority's address. Omit the variable in production to send to the real
recipient.

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

## VIN Lookup Modules

VINs are fetched asynchronously from external websites. Each lookup source is
defined in `src/lib/vinSources.ts` using a `VinSource` object. A module
specifies how to construct the request and how to extract the VIN from the
response.

```ts
export interface VinSource {
  id: string;
  label: string;
  buildUrl: (plate: string, state: string) => string;
  method?: string;
  headers?: Record<string, string>;
  buildBody?: (plate: string, state: string) => unknown;
  selector?: string;
  parse?: (text: string) => string | null;
}
```

`defaultVinSources` holds the built‑in modules. When a VIN lookup occurs, the
app loads the module status list from `data/vinSources.json` (overridden via the
`VIN_SOURCE_FILE` env var). Each status record stores whether the module is
enabled and how many times it has failed consecutively.

Successful lookups reset the failure count. Failures increment the count; after
more than three consecutive failures the module is automatically disabled. The
settings page (`/settings`) shows each module's failure count and allows
manually enabling or disabling modules.

### Adding a New Module

1. Add an entry to `defaultVinSources` describing how to call the service and
   where to find the VIN.
2. Run the app once (or create the `data/vinSources.json` file) to generate a
   status entry for the new module.
3. Visit `/settings` to verify the module appears and enable or disable it as
   desired.

## Docker

To run the app in containers, install Docker and Docker Compose then build the stack:

```bash
docker compose up -d
```

The compose file sets `platform: \"linux/amd64\"` so builds use an architecture
with prebuilt Node.js binaries.

Traefik will serve the application at `https://730op.synology.me/photo-citation` using the labels defined in `docker-compose.yml`.
