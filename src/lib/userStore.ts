import { eq } from "drizzle-orm";
import { orm } from "./orm";
import { users } from "./schema";

export interface UserRecord {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: string;
}

export function getUser(id: string): UserRecord | null {
  const row = orm.select().from(users).where(eq(users.id, id)).get();
  return row ? { ...row } : null;
}

export function updateUser(
  id: string,
  updates: Partial<Pick<UserRecord, "name" | "image">>,
): UserRecord | null {
  const data: Record<string, string | null> = {};
  if (updates.name !== undefined) data.name = updates.name;
  if (updates.image !== undefined) data.image = updates.image;
  if (Object.keys(data).length)
    orm.update(users).set(data).where(eq(users.id, id)).run();
  return getUser(id);
}
