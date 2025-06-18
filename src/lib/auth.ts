import crypto from "node:crypto";
import {
  SQLiteDrizzleAdapter,
  defineTables,
} from "@auth/drizzle-adapter/lib/sqlite.js";
import { eq, sql } from "drizzle-orm";
import { migrationsReady } from "./db";
import { orm } from "./orm";
import { users } from "./schema";

export function authAdapter() {
  const base = SQLiteDrizzleAdapter(orm, defineTables({ usersTable: users }));
  return {
    ...base,
    async createUser(data) {
      if (!data.id) data.id = crypto.randomUUID();
      return base.createUser(data);
    },
  };
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
