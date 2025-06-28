import { z } from "zod";
import type { LocalizedText } from "./localization";
import "./zod-setup";

export type CaseChatAction =
  | { id: string }
  | { field: string; value: string }
  | { photo: string; note: string };

export interface CaseChatReply {
  response: LocalizedText;
  actions: CaseChatAction[];
  noop: boolean;
  language: string;
}

export const caseChatReplySchema = z.object({
  response: z.record(z.string()),
  actions: z.array(
    z.union([
      z.object({ id: z.string() }),
      z.object({ field: z.string(), value: z.string() }),
      z.object({ photo: z.string(), note: z.string() }),
    ]),
  ),
  noop: z.boolean(),
  language: z.string(),
});
