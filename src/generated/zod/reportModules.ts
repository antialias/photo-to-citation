// Generated by ts-to-zod
import { z } from "zod";

export const reportModuleSchema = z.object({
  id: z.string(),
  authorityName: z.string(),
  authorityEmail: z.string(),
  authorityAddress: z.string().optional(),
});
