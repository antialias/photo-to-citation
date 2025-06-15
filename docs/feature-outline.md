# Feature Documentation Outline

This document provides an outline for user-focused documentation of each major feature in **Photo To Citation**.

## 1. Introduction

**Photo To Citation** turns a quick photo into a formal citation. Point your
phone at the offending vehicle, snap a picture, and the app works behind the
scenes to ensure the registered owner receives a citation and appropriate
chastisement. It helps residents gather evidence of parking violations,
especially those blocking sidewalks or bike lanes, and forwards everything to
the proper authorities.

### 1.1 Purpose
- Empower citizens to report obstacles that endanger pedestrians and cyclists.
- Provide a single place to upload and review parking violation photos.
- Use automated tools to analyze images and prepare citation details.
- Ensure the registered owner receives a citation and appropriate chastisement whenever possible.
- Maintain a record of each case from creation through resolution.

### 1.2 Key Capabilities
- Create cases directly from uploaded photos or inbound email.
- Automatically extract location and vehicle details.
- Generate reports and send notifications via email, SMS, and snail mail.
- Track citation status and integrate with VIN lookup modules.

## 2. Getting Started

**Photo To Citation** runs on Node.js and uses environment variables to connect
to various services. Follow these basic steps to get a local copy running:

1. Clone the repository and install dependencies using `npm install`.
2. Copy `.env.example` to `.env.local` and populate the required variables. The
   most important keys include those for your LLM provider (see `OPENAI_API_KEY`),
   Twilio, and the snail mail service.
3. Start the development server with `npm run dev` and open
   `http://localhost:3000` to see the app.

These steps give you a working development environment. The server reloads when
files change, so you can iterate quickly. Review the `docker-compose.example.yaml` file
if you want to spin up supporting services with Docker.

### 2.1 Environment Variables

Environment variables control connections to email, SMS, and image analysis
providers. Keep your keys private and never commit them to the repository.
See `.env.example` for the definitive list of configurable variables.
`README.md` elaborates on how each one is used.

## 3. Case Management

Every report begins as a **case**. A case contains one or more photos,
location details, and the status of any citation requests.

### 3.1 Creating a Case

Upload a photo from your phone or drag files onto the web page to start a new
case. Dragging files onto an existing case tile will append them to that case,
while dropping on empty space creates a new case. The system reads EXIF data to
capture GPS coordinates and prompts you for any missing information.

### 3.2 Viewing and Updating

Use the case list to review submissions. Selecting a case shows its current
status, extracted vehicle details, and any correspondence sent to authorities or
vehicle owners. You can add notes or attach additional photos at any time.

### 3.3 Multiple Photos

Sometimes you need more than one image to document a violation. Each case can
hold many photos. Upload them all at once or return later to attach new images.
The analysis process will run on every photo and merge the results into a single
report.

### 3.4 Mobile Point-and-Shoot

Open `/point` on a phone to launch a streamlined camera page. The camera view
fills the screen with two overlays:

- **Upload Picture** prompts for one or more images from the device.
- **Take Picture** immediately snaps a photo and starts a new case.

A small "Cases" link leads to the full case list if needed.
Desktop users can access this page from the "Point & Shoot" link in the header.

## 4. Automatic Analysis

Every uploaded photo is processed by a language model workflow that classifies
the violation and extracts important details. The analysis runs automatically in
the background so cases update even if the user leaves the page.

### 4.1 Image Analysis Workflow

The system sends each photo to the configured language model with a prompt
describing the expected fields. The response is validated against a schema
before being stored in the case record.

### 4.2 Handling Errors

If the analysis fails or returns invalid data, the job logs an error and
continues without blocking the case. Users can review the log and trigger a new
analysis run if needed.

### 4.3 Reanalyzing Cases

Cases may be reanalyzed at any time. This is useful when analysis logic is
updated or additional photos are added. Previous results are replaced with the
new analysis output.

## 5. Geolocation

Photos often contain GPS coordinates in their EXIF metadata. These coordinates
determine where the violation occurred and help authorities follow up.

### 5.1 Extracting GPS

When a photo is uploaded, the system checks for embedded GPS data. If present,
the coordinates are saved with the case and used to prefill the location fields.

### 5.2 Reverse Geocoding

To turn raw coordinates into street addresses, the app uses the Google Maps API
for reverse geocoding. This provides readable location details for the final
report.

## 6. Report Generation

Once analysis and geolocation are complete, the system assembles the data into a
formal violation report.

### 6.1 Building Reports

Reports include photos, location information, and extracted vehicle details.
They summarize the evidence in a format suitable for mailing or email.

### 6.2 Overrides

Users can edit the analysis results before finalizing a report. These overrides
ensure the citation reflects the most accurate information.

### 6.3 Preparing Citations

The finalized report feeds into the citation template. From here, the app
generates PDFs or email drafts ready to send via the configured channels.

## 7. Communication Channels
### 7.1 Email
- SMTP configuration
- Sending case reports
- Mock address support

### 7.2 Snail Mail
- Overview of providers (mock, file, Docsmit)
- Provider configuration
- Polling for mail status

### 7.3 Phone and SMS
- Twilio integration for SMS/WhatsApp/robocalls
- Required credentials
- Opt-in and notification flow

## 8. Inbox Scanning
- IMAP configuration
- Converting inbound email to cases

## 9. VIN Lookup
- VIN source modules
- Enabling/disabling modules via settings
- Adding new lookup modules

## 10. Citation Tracking
- Citation status modules
- Updating case status from county court systems

## 11. Ownership Requests
- Requesting vehicle ownership details
- Mailing address and fee information

## 12. Jobs and Workers
- Background task scheduler
- Job types (analysis, geocoding, snail mail)
- Monitoring job progress

## 13. Settings Page
- Managing VIN and citation modules
- Selecting snail mail provider
- Environment-based options

## 14. Docker Deployment
- Using docker compose
- Serving the app with Traefik

