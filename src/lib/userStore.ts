import { eq } from "drizzle-orm";
import { orm } from "./orm";
import { profileEvents } from "./profileEvents";
import { users } from "./schema";

export interface UserRecord {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  bio: string | null;
  socialLinks: string | null;
  profileStatus: string;
  profileReviewNotes: string | null;
  role: string;
}

export function getUser(id: string): UserRecord | null {
  const row = orm.select().from(users).where(eq(users.id, id)).get();
  return row ? { ...row } : null;
}

export function updateUser(
  id: string,
  updates: Partial<
    Pick<
      UserRecord,
      | "name"
      | "image"
      | "bio"
      | "socialLinks"
      | "profileStatus"
      | "profileReviewNotes"
    >
  >,
): UserRecord | null {
  const data: Record<string, string | null> = {};
  if (updates.name !== undefined) data.name = updates.name;
  if (updates.image !== undefined) data.image = updates.image;
  if (updates.bio !== undefined) data.bio = updates.bio;
  if (updates.socialLinks !== undefined) data.socialLinks = updates.socialLinks;
  if (updates.profileStatus !== undefined)
    data.profileStatus = updates.profileStatus;
  if (updates.profileReviewNotes !== undefined)
    data.profileReviewNotes = updates.profileReviewNotes;
  if (Object.keys(data).length)
    orm.update(users).set(data).where(eq(users.id, id)).run();
  const updated = getUser(id);
  if (updated) profileEvents.emit("update", updated);
  return updated;
}

export function setProfileStatus(
  id: string,
  status: "under_review" | "published" | "hidden",
  notes?: string | null,
): void {
  orm
    .update(users)
    .set({ profileStatus: status, profileReviewNotes: notes ?? null })
    .where(eq(users.id, id))
    .run();
  const updated = getUser(id);
  if (updated) profileEvents.emit("update", updated);
}
