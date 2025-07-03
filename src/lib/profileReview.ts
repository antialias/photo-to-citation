import { runJob } from "./jobScheduler";
import { reviewProfileContent } from "./openai";
import { getUser, updateUser } from "./userStore";

export async function reviewProfile(userId: string): Promise<void> {
  const user = getUser(userId);
  if (!user) return;
  const text = `${user.name ?? ""}\n${user.bio ?? ""}\n${user.socialLinks ?? ""}`;
  try {
    const result = await reviewProfileContent(text);
    if (result.publish) {
      updateUser(userId, { profileStatus: "published", reviewReason: null });
    } else {
      updateUser(userId, {
        profileStatus: "hidden",
        reviewReason: result.reason ?? "",
      });
    }
  } catch {
    updateUser(userId, { profileStatus: "under_review" });
  }
}

export function reviewProfileInBackground(userId: string): void {
  runJob("reviewProfile", { userId });
}
