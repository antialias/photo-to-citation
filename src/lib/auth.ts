import { DrizzleAdapter } from "@auth/drizzle-adapter";
import type { DefaultSQLiteSchema } from "@auth/drizzle-adapter";
import { eq, sql } from "drizzle-orm";
import { migrationsReady } from "./db";
import { orm } from "./orm";
import { users } from "./schema";

export const authSchema = {
  usersTable: users,
} satisfies Partial<DefaultSQLiteSchema>;

export function authAdapter() {
  return DrizzleAdapter(orm, authSchema);
}

export async function seedSuperAdmin(newUser?: {
  id: string;
  email: string | null;
}) {
  await migrationsReady;
  const existing = orm
    .select()
    .from(users)
    .where(eq(users.role, "superadmin"))
    .get();
  if (existing) return;
  let target: { id: string } | undefined;
  const envEmail = process.env.SUPER_ADMIN_EMAIL;
  if (envEmail) {
    if (newUser && newUser.email === envEmail) target = newUser;
    else
      target = orm.select().from(users).where(eq(users.email, envEmail)).get();
  } else {
    target =
      newUser ?? orm.select().from(users).orderBy(sql`rowid`).limit(1).get();
  }
  if (target) {
    orm
      .update(users)
      .set({ role: "superadmin" })
      .where(eq(users.id, target.id))
      .run();
  }
}
