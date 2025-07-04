import { parentPort, workerData } from "node:worker_threads";
import { migrationsReady } from "@/lib/db";
import { reviewProfile } from "@/lib/openai";
import { getUnleash } from "@/lib/unleash";
import { getUser, setProfileStatus } from "@/lib/userStore";

(async () => {
  await migrationsReady;
  if (!getUnleash().isEnabled("profile-review")) {
    if (parentPort) parentPort.postMessage("done");
    return;
  }
  const { jobData } = workerData as { jobData: { userId: string } };
  const user = getUser(jobData.userId);
  if (!user) throw new Error("user not found");
  const result = await reviewProfile({
    name: user.name,
    bio: user.bio,
    socialLinks: user.socialLinks,
  });
  if (result.flagged) {
    setProfileStatus(jobData.userId, "hidden", result.reason ?? null);
  } else {
    setProfileStatus(jobData.userId, "published", null);
  }
  if (parentPort) parentPort.postMessage("done");
})().catch((err) => {
  console.error("reviewProfile job failed", err);
  if (parentPort) parentPort.postMessage("error");
});
