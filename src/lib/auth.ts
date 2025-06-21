import crypto from "node:crypto";
import type { AdapterUser } from "@auth/core/adapters";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { eq, sql } from "drizzle-orm";
import { config } from "./config";
import { migrationsReady } from "./db";
import { orm } from "./orm";
import { users } from "./schema";

export function authAdapter() {
  const base = DrizzleAdapter<typeof orm>(orm, {
    usersTable: users,
  } as unknown as Parameters<typeof DrizzleAdapter<typeof orm>>[1]);
  return {
    ...base,
    async createUser(data: AdapterUser & { id?: string }) {
      console.log("authAdapter.createUser", data.email);
      if (!data.id) data.id = crypto.randomUUID();
      if (!base.createUser) throw new Error("createUser not implemented");
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
  const envEmail = config.SUPER_ADMIN_EMAIL;
  if (envEmail?.length && envEmail.length > 0) {
    if (newUser && newUser.email === envEmail) target = newUser;
    else
      target = orm.select().from(users).where(eq(users.email, envEmail)).get();
  } else {
    target =
      newUser ?? orm.select().from(users).orderBy(sql`rowid`).limit(1).get();
  }
  if (target) {
    console.log("seeding super admin", newUser?.email);
    orm
      .update(users)
      .set({ role: "superadmin" })
      .where(eq(users.id, target.id))
      .run();
  }
}
