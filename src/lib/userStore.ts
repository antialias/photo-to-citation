import { eq } from "drizzle-orm";
import { orm } from "./orm";
import { users } from "./schema";

export interface UserRecord {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  bio: string | null;
  social: string | null;
  profileStatus: string;
  profileReason: string | null;
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
      "name" | "image" | "bio" | "social" | "profileStatus" | "profileReason"
    >
  >,
): UserRecord | null {
  const data: Record<string, string | null> = {};
  if (updates.name !== undefined) data.name = updates.name;
  if (updates.image !== undefined) data.image = updates.image;
  if (updates.bio !== undefined) data.bio = updates.bio;
  if (updates.social !== undefined) data.social = updates.social;
  if (updates.profileStatus !== undefined)
    (data as Record<string, string>).profile_status = updates.profileStatus;
  if (updates.profileReason !== undefined)
    (data as Record<string, string | null>).profile_reason =
      updates.profileReason;
  if (Object.keys(data).length)
    orm.update(users).set(data).where(eq(users.id, id)).run();
  return getUser(id);
}
