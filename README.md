# Photo To Citation

Photo To Citation is an experimental app that helps residents of Oak Park, IL
report vehicle violations that jeopardize pedestrian and non‑motorized safety.
The goal is to take an uploaded photo of a violation and automatically produce a
report that can be sent to the appropriate civil authorities. The system
attempts to track each report until it becomes an official citation, even when
that involves manual steps like mailing forms or payments.

## Tech Stack

- ✅ **Next.js 14** (App Router with React Server Components)
- 🎨 **Panda CSS + shadcn/ui + Radix UI**
- 🧠 **Drizzle ORM with SQLite**
- 🔄 **React Query (TanStack Query)** for client interactivity
- 🔐 **Lucia or NextAuth.js** for authentication
- ⚡ **Framer Motion** for animations
- 🧪 **Zod** for schema validation
- 🖼️ **react-icons** for iconography

This stack is designed for performance, type safety, and complete control over hosting and infrastructure.

## Styling with Panda CSS

Panda generates static styles based on the tokens and `css` utilities used in the
codebase. Run `pnpm run panda` whenever you modify tokens or add new components
to keep the `styled-system` directory up to date.

## Getting Started

Install dependencies and generate Panda styles before starting the development server:

```bash
pnpm install
pnpm run panda -- --watch # omit --watch in production
pnpm run dev
```

Run `pnpm run panda` at least once before type-checking, starting the server,
or building Storybook.
The generated `styled-system` directory is excluded from version control.

Use [`Biome`](https://biomejs.dev/) for consistent formatting and linting:

```bash
pnpm run lint
pnpm run format
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

The UI language comes from the `language` cookie. When it doesn't exist, the
server reads the `Accept-Language` header to pick the first supported locale
(`en`, `es`, or `fr`). The client persists this value by setting the cookie on
the first render, and `I18nProvider` falls back to `navigator.languages` if the
cookie is still missing.

For local HTTPS, run:

```bash
pnpm run https
```

Then browse to [https://localhost](https://localhost).

## Authentication

Copy `.env.example` to `.env` and set `SUPER_ADMIN_EMAIL` to automatically
promote that user to the `superadmin` role on their first sign in. Add a
`NEXTAUTH_SECRET` for signing cookies and set `NEXTAUTH_URL` to your site URL
(include the base path when `NEXT_PUBLIC_BASE_PATH` is configured). When
`SUPER_ADMIN_EMAIL` is omitted, the very first registered user becomes the
super admin.

NextAuth now integrates with Drizzle using a custom adapter that points to the
`users` table so the user's role appears in the session object.

The sign‑in flow sends a verification email, so set `SMTP_HOST`, `SMTP_PORT`,
`SMTP_USER`, `SMTP_PASS`, and `SMTP_FROM` in your environment. Without these
values login emails cannot be delivered.

To enable Google sign‑in, also provide `GOOGLE_CLIENT_ID` and
`GOOGLE_CLIENT_SECRET`. A Terraform module under `terraform/google-oauth`
creates these credentials:

```bash
cd terraform/google-oauth
terraform init
terraform apply
```

To enable Facebook sign-in, set `FACEBOOK_CLIENT_ID` and
`FACEBOOK_CLIENT_SECRET` in your environment. Facebook does not have a
Terraform module here, so create an app in the Facebook developer console and
copy the credentials into `.env.local`.

OAuth provider status is stored in `data/oauthProviders.json` (overridable via
`OAUTH_PROVIDER_FILE`). Super admins can enable or disable each provider from
the Admin page.

Copy the outputs into `.env.local` for the production deployment.

## Generating Zod Schemas

When interfaces in `src/lib` change, update the runtime schemas and verify the output with:

```bash
pnpm run generate:schemas
```

The command uses `ts-to-zod` with `ts-to-zod.config.js` to write schemas under `src/generated/zod`.
It then type-checks the generated files using `tsc` and fails if any errors are detected.

## Database Migrations

Run database migrations whenever the schema changes:

```bash
pnpm run migrate
```

Generate new migration files from the Drizzle schema with:

```bash
pnpm run generate:migrations
```

To consolidate old migrations into a single baseline, keep only the most recent
files using:

```bash
pnpm run squash:migrations -- --keep 5
```

Omit the `--keep` option to retain the latest 10 migrations. Pass `--help` for
usage details.

Migrations are stored as SQL files under the `migrations` folder and applied at
runtime. The default SQLite database is `data/cases.sqlite`. Per-photo analysis
results now live in the `case_photo_analysis` table instead of the JSON
`analysis.images` field.

## Administration

Visit `/admin` to manage users and Casbin policies. Admins can invite
collaborators by entering an email address. The app creates the user with the
`user` role and sends an invitation link. Super admins may edit the Casbin rule
list directly in the UI. After saving, the server reloads the policy set so
changes take effect immediately.

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
triggers analysis by the configured language model in the background. These
asynchronous tasks are launched with `runJob` from `src/lib/jobScheduler.ts`.
Each job runs in a worker thread via `src/jobs/workerWrapper.js` to handle image
analysis and reverse geocoding. The resulting JSON is persisted alongside the
case record once the analysis completes, so uploads are never blocked waiting
for the LLM.

If a case ends up without analysis or the last attempt failed with a retryable
error code, you can trigger a new pass with:

```bash
pnpm run reanalyze
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
# Save sent emails to a JSON file instead of sending
EMAIL_FILE=emails.json
```

If `MOCK_EMAIL_TO` is set, all outgoing email will be directed there instead of
the authority's address. Omit the variable in production to send to the real
recipient. When the variable is unset, super admins can specify an override
address from the **App Configuration** tab. This runtime value is ignored when
`MOCK_EMAIL_TO` is present.
When running end-to-end tests, `startServer` automatically assigns
`EMAIL_FILE` to a temporary path so that all emails are captured rather than
sent.

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
`SNAIL_MAIL_FILE`. Run `pnpm run poll:snailmail` to invoke provider polling.

Snail mail provider health is stored in `data/snailMailProviders.json` (overridable
via `SNAIL_MAIL_PROVIDER_FILE`). The active provider and failure counts can be
viewed on the Settings page.

## Check Writer

Checks mailed with ownership requests use these settings:

```bash
CHECK_ACCOUNT_NUMBER=123456789
CHECK_ROUTING_NUMBER=987654321
```

If these variables are not set, check generation fails.

## Twilio Integration

Configure Twilio credentials to enable SMS, WhatsApp, and robocall
notifications:

```bash
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_FROM_NUMBER=+15551234567
```

A Terraform module under `terraform/twilio` can create this phone number and output the values above.

```bash
cd terraform/twilio
terraform init
terraform apply
```

The provider uses your Twilio account SID as the username and the auth token as
the password.

Copy the outputs into `.env.local`.
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

Run `pnpm run scan:inbox` to start listening for new messages. Each email with
one or more photo attachments becomes a new case. The sender's address is
matched against existing user accounts and, when found, ownership is assigned to
that user. A receipt is emailed back with a link to the case and a token in the
subject like `[cid:123]`. If the user replies with additional photos and the
token remains in the subject, those images are added to the same case before
analysis and geocoding run in the background.

## Automated Cleanup

Remove abandoned anonymous cases by running:

```bash
pnpm run cleanup:anon-cases
```

Add this command to cron or another scheduler to run daily, e.g.:

```cron
0 3 * * * cd /path/to/app && pnpm run cleanup:anon-cases >> cleanup.log 2>&1
```

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
App Configuration tab on the admin page (`/admin`) shows each module's failure
count and allows manually enabling or disabling modules.

### Adding a New Module

1. Add an entry to `defaultVinSources` describing how to call the service and
   where to find the VIN.
2. Run the app once (or create the `data/vinSources.json` file) to generate a
   status entry for the new module.
3. Visit `/admin` and open the App Configuration tab to verify the module
   appears and enable or disable it as desired.

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

Add new modules to this record and run `pnpm run generate:schemas` to update the
runtime schema.

## Testing

Run all unit tests with:

```bash
pnpm test
```

Generate a coverage report and fail if coverage drops below the configured
thresholds with:

```bash
pnpm run test:coverage
```

Run just the essential end-to-end smoke tests with:

```bash
pnpm run e2e:smoke
```

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
The workflow caches build layers with GitHub Actions so subsequent runs reuse these layers and finish faster.
The `docker-build-photo-citation.yml` workflow publishes a second image tagged
`photo-citation` for NAS deployments requiring `NEXT_PUBLIC_BASE_PATH=/photo-citation`.

Run Traefik separately and it will use the labels in
`docker-compose.example.yaml` to route traffic to
`https://730op.synology.me/photo-citation`.

Set `NEXT_PUBLIC_BASE_PATH=/photo-citation` in your `.env` (or container
environment) and remove the Traefik `stripprefix` middleware so the app serves
correctly at that subpath. The `next.config.ts` file applies this base path to
both `basePath` and `assetPrefix` so that the runtime bundle and assets load
from `/photo-citation` as well.

## Marketing Website

This repo includes a simple [Eleventy](https://www.11ty.dev/) setup under the
`website` directory for the marketing site. Pages are written in Markdown and
compiled to static HTML.

Build the site with:

```bash
pnpm run website
```

The output is written to `website/dist`.

The build step uses OpenAI to generate marketing images when they are missing in
the `gh-pages` branch. Set an `OPENAI_API_KEY` secret in your repository so the
GitHub Action can access the API.

Images are declared directly in the markdown with a `data-image-gen` attribute:

```html
<img src="autogen/cat.png" alt="Draw a 2D pixel art cat" width="256" height="256" data-image-gen />
```

The build script scans the site for these tags and calls
`client.images.generate`. Any JSON placed in the `data-image-gen` attribute is
passed through to the API. Width and height attributes become the generated size
unless overridden in the JSON.

## Privacy and Data Use

All photos, contact details and analysis results are stored only to generate the
corresponding citation reports. The app relies on external services such as
OpenAI for image analysis and third‑party mail providers for physical letters.
No uploaded content is sold or shared outside of those providers. You can delete
any case to permanently remove the associated data.

## Notifications

Wrap your application with `<NotificationProvider>` in `src/app/layout.tsx`.
Use the `useNotify` hook in client components to show toast and system
notifications:

```tsx
"use client";
import { useNotify } from "@/app/components/NotificationProvider";

export default function Example() {
  const notify = useNotify();
  return <button onClick={() => notify("Saved!")}>Save</button>;
}
```

The provider requests browser permission so these messages can also appear as native notifications when allowed.

## Browser Debugging

Set `NEXT_PUBLIC_BROWSER_DEBUG` to `true` in your `.env` to enable a JSON
overlay. Hold the Option key while hovering over case images, details, or chat
messages to reveal the tooltip. The tooltip remains visible while you move the
cursor over it so you can easily copy the JSON.

## Feature Flags

Connect to an [Unleash](https://www.getunleash.io/) instance to control
experimental functionality:

```bash
UNLEASH_URL=https://app.your-unleash.com/api
UNLEASH_API_TOKEN=server-secret
NEXT_PUBLIC_UNLEASH_PROXY_URL=https://app.your-unleash.com/proxy
NEXT_PUBLIC_UNLEASH_CLIENT_KEY=frontend-key
```

When these variables are omitted, all feature flags default to disabled.

## Project Links

- [**GitHub Repository**](https://github.com/antialias/photo-to-citation) — star the project or submit a pull request.
- [**Documentation Outline**](docs/feature-outline.md) — discover planned features and architecture.
- [**Credit System**](docs/credit-system.md) — how users purchase credits and how balances update.
- [**Case Chat Buttons**](docs/case-chat-actions.md) — LLM syntax for inserting action buttons.
- [**Capacitor Build Plan**](docs/capacitor-parallel-build.md) — run native builds alongside the web app.
- [**Releases**](https://github.com/antialias/photo-to-citation/releases) — download the latest packaged version.
- [**Live Demo**](https://730op.synology.me/photo-citation) — try the hosted web app.
