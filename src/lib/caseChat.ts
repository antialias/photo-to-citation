import { z } from "zod";
import { localizedTextSchema, rawLocalizedTextSchema } from "./openai";

export type CaseChatAction =
  | { id: string }
  | { field: string; value: string }
  | { photo: string; note: string };

export interface CaseChatReply {
  response: import("./openai").LocalizedText;
  actions: CaseChatAction[];
  noop: boolean;
  lang: string;
}

export const caseChatReplySchema = z.object({
  response: rawLocalizedTextSchema,
  actions: z.array(
    z.union([
      z.object({ id: z.string() }),
      z.object({ field: z.string(), value: z.string() }),
      z.object({ photo: z.string(), note: z.string() }),
    ]),
  ),
  noop: z.boolean(),
  lang: z.string().optional(),
});
