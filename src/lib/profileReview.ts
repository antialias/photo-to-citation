import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { z } from "zod";
import { runJob } from "./jobScheduler";
import { getLlm } from "./llm";
import { chatWithSchema } from "./llmUtils";
import { getUser, updateUser } from "./userStore";

export const profileReviewSchema = z.object({
  ok: z.boolean(),
  reason: z.string().optional(),
});

export async function reviewProfile(userId: string): Promise<void> {
  const user = getUser(userId);
  if (!user) return;
  const { client, model } = getLlm("moderate_profile");
  const messages: ChatCompletionMessageParam[] = [
    {
      role: "system",
      content:
        "You review user profiles for obscene or inappropriate content. Reply in JSON only using the provided schema.",
    },
    {
      role: "user",
      content: `Name: ${user.name ?? ""}\nBio: ${user.bio ?? ""}\nSocial: ${user.social ?? ""}`,
    },
  ];
  try {
    const result = await chatWithSchema(
      client,
      model,
      messages,
      profileReviewSchema,
      { maxTokens: 120 },
    );
    if (result.ok) {
      updateUser(userId, { profileStatus: "published", profileReason: null });
    } else {
      updateUser(userId, {
        profileStatus: "hidden",
        profileReason: result.reason ?? null,
      });
    }
  } catch (err) {
    console.error("reviewProfile failed", err);
    updateUser(userId, { profileStatus: "under_review" });
  }
}

export function reviewProfileInBackground(userId: string): void {
  runJob("reviewProfile", { userId });
}
