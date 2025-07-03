import { runJob } from "./jobScheduler";

export function reviewProfileInBackground(userId: string): void {
  runJob("reviewProfile", { userId });
}
