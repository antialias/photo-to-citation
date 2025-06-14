# Photo To Citation

Photo To Citation is an experimental app that helps residents of Oak Park, IL report vehicle violations that jeopardize pedestrian and non‑motorized safety. The goal is to take an uploaded photo of a violation and automatically produce a report that can be sent to the appropriate civil authorities. The system attempts to track each report until it becomes an official citation, even when that involves manual steps like mailing forms or payments.

## Tech Stack

- ✅ **Next.js 14** (App Router with React Server Components)
- 🎨 **Tailwind CSS + shadcn/ui + Radix UI**
 - 🧠 **Drizzle ORM with SQLite**
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

When interfaces in `src/lib` change, update the runtime schemas and verify the output with:

```bash
npm run generate:schemas
```

The command uses `ts-to-zod` with `ts-to-zod.config.js` to write schemas under `src/generated/zod`.
It then type-checks the generated files using `tsc` and fails if any errors are detected.

## Database Migrations

Run database migrations whenever the schema changes:

```bash
npm run migrate
```

Generate new migration files from the Drizzle schema with:

```bash
npm run generate:migrations
```

Migrations are stored as SQL files under the `migrations` folder and applied at runtime. The default SQLite database is `data/cases.sqlite`. Per-photo analysis results now live in the `case_photo_analysis` table instead of the JSON `analysis.images` field.

## OpenAI Integration

Copy `.env.example` to `.env` and add your API key:

```bash
OPENAI_API_KEY=your-key
```

The helpers in `src/lib/openai.ts` use this key by default through the
configuration defined in `src/lib/llm.ts`. They send images to the model and request
a JSON response describing the violation. The response is validated with Zod to
ensure it matches the expected schema. If validation fails, the helper retries
the request, providing the previous response and error to guide the model. The
JSON schema includes the violation type, location clues, and vehicle details
such as make, model, color and license plate information.

`src/lib/llm.ts` also allows selecting different providers and models for
features like drafting emails or OCR. Set environment variables such as
`LLM_DRAFT_EMAIL_MODEL` or `LLM_OCR_PAPERWORK_PROVIDER` to override the defaults.

`ocrPaperwork` uses the same client to transcribe public paperwork images. It
returns the full transcription exactly as it appears. After generating this raw
text, the helper sends it back to the LLM with a JSON schema requesting contact
information for the registered owner, VIN, registration status, license plate
details and any calls to action. The extraction schema mirrors fields from the
image analysis so the resulting `PaperworkInfo` object fits alongside the
violation report data.

When a user uploads a photo, the API stores the case immediately and then
triggers analysis by the configured language model in the background. These asynchronous tasks are
managed by [Bree](https://github.com/breejs/bree), which spawns worker threads
to handle image analysis and reverse geocoding. The resulting JSON is persisted
alongside the case record once the analysis completes, so uploads are never
blocked waiting for the LLM.

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

## Snail Mail Provider

Snail mail messages are first converted to a PDF and then handed off to a
provider. The default provider is `mock`, which performs no action. You can save
the PDFs locally by using the `file` provider or send them through
[Docsmit](https://docs.docsmit.com).

Set these variables in `.env` to enable the Docsmit provider:

```bash
DOCSMIT_EMAIL=you@example.com
DOCSMIT_PASSWORD=secret
DOCSMIT_SOFTWARE_ID=uuid
# optional override for testing
DOCSMIT_BASE_URL=https://secure.tracksmit.com/api/v1
RETURN_ADDRESS="Your Name\n1 Main St\nCity, ST 12345"
SNAIL_MAIL_PROVIDER=docsmit
# for the file provider
SNAIL_MAIL_OUT_DIR=data/snailmail_out
```

All sent mail is logged to `data/snailMail.json` or the file specified by
`SNAIL_MAIL_FILE`. Run `npm run poll:snailmail` to invoke provider polling.

Snail mail provider health is stored in `data/snailMailProviders.json` (overridable
via `SNAIL_MAIL_PROVIDER_FILE`). The active provider and failure counts can be
viewed on the Settings page.

## Twilio Integration

Configure Twilio credentials to enable SMS, WhatsApp, and robocall
notifications:

```bash
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_FROM_NUMBER=+15551234567
```

If these variables are not set, phone notifications are skipped.

## Inbox Scanning

Configure IMAP settings in `.env` to automatically create cases from incoming
emails. The scanner uses the `IDLE` command to receive updates and stores the
last processed UID in `data/inbox.json` (or the path in `INBOX_STATE_FILE`).

```bash
IMAP_HOST=mail.example.com
IMAP_PORT=993
IMAP_USER=username
IMAP_PASS=password
# disable TLS by setting this to "false"
IMAP_TLS=true
INBOX_STATE_FILE=data/inbox.json
```

Run `npm run scan:inbox` to start listening for new messages. Each email with
one or more photo attachments becomes a new case. Multiple photos in the same
email are added to that case before analysis and geocoding run in the
background.

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

## Citation Status Modules

Citation status modules query a county court system to track the progress of a
citation. They live in `src/lib/citationStatusModules.ts` and share this
interface:

```ts
export interface CitationStatusModule {
  id: string;
  lookupCitationStatus: (
    state: string,
    county: string,
    citation: string,
  ) => Promise<{
    citation: string;
    status: string;
    updatedAt: string;
  } | null>;
}

export const citationStatusModules: Record<string, CitationStatusModule> = {
  mock: {
    id: "mock",
    async lookupCitationStatus(state, county, citation) {
      return {
        citation,
        status: `Citation ${citation} for ${county} County, ${state} is pending`,
        updatedAt: new Date().toISOString(),
      };
    },
  },
};
```

Add new modules to this record and run `npm run generate:schemas` to update the
runtime schema.

## Docker

To run the app in containers, install Docker and Docker Compose then build the stack:

```bash
docker compose up -d
```

The compose file sets `platform: \"linux/amd64\"` so builds use an architecture
with prebuilt Node.js binaries.

### Publishing to GHCR

When commits land on `main`, the `docker-build.yml` workflow pushes the image to
GitHub Container Registry as `ghcr.io/<OWNER>/photo-to-citation:latest`. Point
Watchtower at this tag so your Synology NAS automatically pulls updates and redeploys.

Run Traefik separately and it will use the labels in `docker-compose.example.yaml` to route traffic to `https://730op.synology.me/photo-citation`.

## Marketing Website

This repo includes a simple [Eleventy](https://www.11ty.dev/) setup under the `website` directory for the marketing site. Pages are written in Markdown and compiled to static HTML.

Build the site with:

```bash
npm run website
```

The output is written to `website/dist`.

The build step uses OpenAI to generate marketing images when they are missing in the `gh-pages` branch. Set an `OPENAI_API_KEY` secret in your repository so the GitHub Action can access the API.

The `scripts/generateWebsiteImages.ts` script defines prompts for each PNG used on the site. When new pages reference additional graphics, add a spec in that file so GitHub Actions can render them with GPT‑4o during the main-branch build. The **community**, **mission**, and **ethos** illustrations on the about page are produced this way.

## Browser Debugging
Set `NEXT_PUBLIC_BROWSER_DEBUG` to `true` in your `.env` to enable a JSON overlay. Hold the Option key while hovering over case images or details to reveal the tooltip. The tooltip remains visible while you move the cursor over it so you can easily copy the JSON.

## Project Links

- [**GitHub Repository**](https://github.com/antialias/photo-to-citation) — star the project or submit a pull request.
- [**Documentation Outline**](docs/feature-outline.md) — discover planned features and architecture.
- [**Releases**](https://github.com/antialias/photo-to-citation/releases) — download the latest packaged version.
- [**Live Demo**](https://730op.synology.me/photo-citation) — try the hosted web app.
