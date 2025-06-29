import { caseSchema } from "@/generated/zod/caseStore";
import { emailOptionsSchema } from "@/generated/zod/email";
import { reportModuleSchema } from "@/generated/zod/reportModules";
import { snailMailProviderStatusSchema } from "@/generated/zod/snailMailProviders";
import { vinSourceStatusSchema } from "@/generated/zod/vinSources";
import { initContract } from "@ts-rest/core";
import { z } from "zod";

const c = initContract();

const idParams = z.object({ id: z.string() });
const okSchema = z.object({ ok: z.boolean() });
const errorSchema = z.object({ error: z.string() });

export const apiContract = c.router({
  getCases: c.query({
    method: "GET",
    path: "/api/cases",
    responses: c.responses({
      200: caseSchema.array(),
    }),
    summary: "List cases",
    description: "Fetch all stored cases.",
  }),
  getCase: c.query({
    method: "GET",
    path: "/api/cases/:id",
    pathParams: idParams,
    responses: c.responses({
      200: caseSchema,
      404: errorSchema,
    }),
    summary: "Get case",
    description: "Retrieve a case by ID.",
  }),
  deleteCase: c.mutation({
    method: "DELETE",
    path: "/api/cases/:id",
    pathParams: idParams,
    responses: c.responses({
      200: okSchema,
      404: errorSchema,
    }),
    summary: "Delete case",
    description: "Delete a case by ID.",
    body: c.noBody(),
  }),
  upload: c.mutation({
    method: "POST",
    path: "/api/upload",
    contentType: "multipart/form-data",
    body: c.type<unknown>(),
    responses: c.responses({
      200: z.object({ caseId: z.string() }),
      400: errorSchema,
      404: errorSchema,
    }),
    summary: "Upload photo",
    description: "Upload a case photo and create or update a case.",
  }),
  overrideCase: c.mutation({
    method: "PUT",
    path: "/api/cases/:id/override",
    pathParams: idParams,
    body: c.type<Record<string, unknown>>(),
    responses: c.responses({
      200: caseSchema,
      404: errorSchema,
    }),
    summary: "Set analysis overrides",
    description: "Apply analysis overrides to a case.",
  }),
  clearOverride: c.mutation({
    method: "DELETE",
    path: "/api/cases/:id/override",
    pathParams: idParams,
    body: c.noBody(),
    responses: c.responses({
      200: caseSchema,
      404: errorSchema,
    }),
    summary: "Remove analysis overrides",
    description: "Clear any analysis overrides from a case.",
  }),
  setVin: c.mutation({
    method: "PUT",
    path: "/api/cases/:id/vin",
    pathParams: idParams,
    body: c.type<{ vin: string | null }>(),
    responses: c.responses({
      200: caseSchema,
      404: errorSchema,
    }),
    summary: "Override VIN",
    description: "Set a VIN override for a case.",
  }),
  clearVin: c.mutation({
    method: "DELETE",
    path: "/api/cases/:id/vin",
    pathParams: idParams,
    body: c.noBody(),
    responses: c.responses({
      200: caseSchema,
      404: errorSchema,
    }),
    summary: "Remove VIN override",
    description: "Clear any VIN override from a case.",
  }),
  setCaseNote: c.mutation({
    method: "PUT",
    path: "/api/cases/:id/note",
    pathParams: idParams,
    body: c.type<{ note: string | null }>(),
    responses: c.responses({
      200: caseSchema,
      404: errorSchema,
    }),
    summary: "Set case note",
    description: "Update the note for a case.",
  }),
  setPhotoNote: c.mutation({
    method: "PUT",
    path: "/api/cases/:id/photo-note",
    pathParams: idParams,
    body: c.type<{ photo: string; note: string | null }>(),
    responses: c.responses({
      200: caseSchema,
      404: errorSchema,
    }),
    summary: "Set photo note",
    description: "Update the note for a case photo.",
  }),
  translateCaseText: c.mutation({
    method: "POST",
    path: "/api/cases/:id/translate",
    pathParams: idParams,
    body: c.type<{ path: string; lang: string }>(),
    responses: c.responses({
      200: caseSchema,
      400: errorSchema,
      404: errorSchema,
    }),
    summary: "Translate case text",
    description: "Translate a text field within a case and store it.",
  }),
  translateChatMessage: c.mutation({
    method: "POST",
    path: "/api/cases/:id/chat/translate",
    pathParams: idParams,
    body: c.type<{ text: string; lang: string }>(),
    responses: c.responses({
      200: z.object({ translation: z.string() }),
      400: errorSchema,
    }),
    summary: "Translate chat message",
    description: "Translate a chat message for a case.",
  }),
  caseStream: c.query({
    method: "GET",
    path: "/api/cases/stream",
    responses: c.responses({
      200: c.otherResponse({
        contentType: "text/event-stream",
        body: c.noBody() as unknown as ReturnType<typeof c.type>,
      }),
    }),
    summary: "Case stream",
    description: "Receive real time case updates via SSE.",
  }),
  getReport: c.query({
    method: "GET",
    path: "/api/cases/:id/report",
    pathParams: idParams,
    responses: c.responses({
      200: z.object({
        email: emailOptionsSchema.pick({ subject: true, body: true }),
        attachments: z.array(z.string()),
        module: reportModuleSchema,
      }),
      404: errorSchema,
    }),
    summary: "Get email draft",
    description: "Draft a violation report email for a case.",
  }),
  sendReport: c.mutation({
    method: "POST",
    path: "/api/cases/:id/report",
    pathParams: idParams,
    body: z.object({
      subject: z.string(),
      body: z.string(),
      attachments: z.array(z.string()),
    }),
    responses: c.responses({
      200: caseSchema,
      404: errorSchema,
      500: errorSchema,
    }),
    summary: "Send violation report",
    description: "Email the drafted violation report for a case.",
  }),
  getVinSources: c.query({
    method: "GET",
    path: "/api/vin-sources",
    responses: c.responses({
      200: z.array(vinSourceStatusSchema),
    }),
    summary: "List VIN sources",
    description: "Retrieve VIN source status list.",
  }),
  updateVinSource: c.mutation({
    method: "PUT",
    path: "/api/vin-sources/:id",
    pathParams: idParams,
    body: z.object({ enabled: z.boolean() }),
    responses: c.responses({
      200: z.array(vinSourceStatusSchema),
      404: errorSchema,
    }),
    summary: "Update VIN source",
    description: "Enable or disable a VIN lookup source.",
  }),
  getSnailMailProviders: c.query({
    method: "GET",
    path: "/api/snail-mail-providers",
    responses: c.responses({
      200: z.array(snailMailProviderStatusSchema),
    }),
    summary: "List snail mail providers",
    description: "Retrieve snail mail provider status list.",
  }),
  updateSnailMailProvider: c.mutation({
    method: "PUT",
    path: "/api/snail-mail-providers/:id",
    pathParams: idParams,
    body: c.noBody(),
    responses: c.responses({
      200: z.array(snailMailProviderStatusSchema),
      404: errorSchema,
    }),
    summary: "Activate snail mail provider",
    description: "Select which snail mail provider is active.",
  }),
});
