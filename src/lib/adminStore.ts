import crypto from "node:crypto";
import { type AnyColumn, and, eq } from "drizzle-orm";
import { isNull } from "drizzle-orm/sql";
import { reloadEnforcer } from "./authz";
import { orm } from "./orm";
import { casbinRules, users } from "./schema";

function eqMaybeNull(column: AnyColumn, value: string | null | undefined) {
  return value == null ? isNull(column) : eq(column, value);
}

export interface UserRecord {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
}

export function listUsers(): UserRecord[] {
  return orm
    .select()
    .from(users)
    .all()
    .map((u: typeof users.$inferSelect) => ({ ...u }));
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
  return orm
    .select()
    .from(casbinRules)
    .all()
    .map((r: typeof casbinRules.$inferSelect) => ({ ...r }));
}

export async function replaceCasbinRules(
  rules: CasbinRule[],
): Promise<CasbinRule[]> {
  orm.delete(casbinRules).run();
  if (rules.length) orm.insert(casbinRules).values(rules).run();
  await reloadEnforcer();
  return getCasbinRules();
}

export async function addCasbinRule(rule: CasbinRule): Promise<CasbinRule[]> {
  orm
    .insert(casbinRules)
    .values({
      ...rule,
      v0: rule.v0 ?? null,
      v1: rule.v1 ?? null,
      v2: rule.v2 ?? null,
      v3: rule.v3 ?? null,
      v4: rule.v4 ?? null,
      v5: rule.v5 ?? null,
    })
    .run();
  await reloadEnforcer();
  return getCasbinRules();
}

export async function updateCasbinRule(
  oldRule: CasbinRule,
  newRule: CasbinRule,
): Promise<CasbinRule[]> {
  orm
    .update(casbinRules)
    .set({
      ...newRule,
      v0: newRule.v0 ?? null,
      v1: newRule.v1 ?? null,
      v2: newRule.v2 ?? null,
      v3: newRule.v3 ?? null,
      v4: newRule.v4 ?? null,
      v5: newRule.v5 ?? null,
    })
    .where(
      and(
        eq(casbinRules.ptype, oldRule.ptype),
        eqMaybeNull(casbinRules.v0, oldRule.v0),
        eqMaybeNull(casbinRules.v1, oldRule.v1),
        eqMaybeNull(casbinRules.v2, oldRule.v2),
        eqMaybeNull(casbinRules.v3, oldRule.v3),
        eqMaybeNull(casbinRules.v4, oldRule.v4),
        eqMaybeNull(casbinRules.v5, oldRule.v5),
      ),
    )
    .run();
  await reloadEnforcer();
  return getCasbinRules();
}

export async function deleteCasbinRule(
  rule: CasbinRule,
): Promise<CasbinRule[]> {
  orm
    .delete(casbinRules)
    .where(
      and(
        eq(casbinRules.ptype, rule.ptype),
        eqMaybeNull(casbinRules.v0, rule.v0),
        eqMaybeNull(casbinRules.v1, rule.v1),
        eqMaybeNull(casbinRules.v2, rule.v2),
        eqMaybeNull(casbinRules.v3, rule.v3),
        eqMaybeNull(casbinRules.v4, rule.v4),
        eqMaybeNull(casbinRules.v5, rule.v5),
      ),
    )
    .run();
  await reloadEnforcer();
  return getCasbinRules();
}
