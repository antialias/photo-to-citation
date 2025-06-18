import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import { reloadEnforcer } from "./authz";
import { orm } from "./orm";
import { casbinRules, users } from "./schema";

export interface UserRecord {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
}

export function listUsers(): UserRecord[] {
  return orm.select().from(users).all();
}

export function inviteUser(email: string, role = "user"): UserRecord {
  const id = crypto.randomUUID();
  orm.insert(users).values({ id, email, role }).run();
  return { id, name: null, email, role };
}

export function disableUser(id: string): void {
  orm.update(users).set({ role: "disabled" }).where(eq(users.id, id)).run();
}

export function updateUserRole(id: string, role: string): void {
  orm.update(users).set({ role }).where(eq(users.id, id)).run();
}

export function deleteUser(id: string): void {
  orm.delete(users).where(eq(users.id, id)).run();
}

export interface CasbinRule {
  ptype: string;
  v0?: string | null;
  v1?: string | null;
  v2?: string | null;
  v3?: string | null;
  v4?: string | null;
  v5?: string | null;
}

export function getCasbinRules(): CasbinRule[] {
  return orm.select().from(casbinRules).all();
}

export async function replaceCasbinRules(
  rules: CasbinRule[],
): Promise<CasbinRule[]> {
  orm.delete(casbinRules).run();
  if (rules.length) orm.insert(casbinRules).values(rules).run();
  await reloadEnforcer();
  return getCasbinRules();
}
