import { z } from "zod";
import "./zod-setup";
import { localizedTextSchema } from "./openai";

export type CaseChatAction =
  | { id: string }
  | { field: string; value: string }
  | { photo: string; note: string };

export interface CaseChatReply {
  lang: string;
  response: import("./openai").LocalizedText;
  actions: CaseChatAction[];
  noop: boolean;
}

export const caseChatReplySchema = z.object({
  lang: z.string(),
  response: localizedTextSchema,
  actions: z.array(
    z.union([
      z.object({ id: z.string() }),
      z.object({ field: z.string(), value: z.string() }),
      z.object({ photo: z.string(), note: z.string() }),
    ]),
  ),
  noop: z.boolean(),
});
