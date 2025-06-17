import { and, eq } from "drizzle-orm";
import { orm } from "./orm";
import { caseMembers } from "./schema";

export type CaseMemberRole = "owner" | "collaborator";

export function addCaseMember(
  caseId: string,
  userId: string,
  role: CaseMemberRole,
): void {
  orm.insert(caseMembers).values({ caseId, userId, role }).run();
}

export function removeCaseMember(caseId: string, userId: string): void {
  orm
    .delete(caseMembers)
    .where(and(eq(caseMembers.caseId, caseId), eq(caseMembers.userId, userId)))
    .run();
}

export function listCaseMembers(caseId: string) {
  return orm
    .select()
    .from(caseMembers)
    .where(eq(caseMembers.caseId, caseId))
    .all();
}

export function isCaseMember(
  caseId: string,
  userId: string,
  role?: CaseMemberRole,
): boolean {
  const row = orm
    .select()
    .from(caseMembers)
    .where(and(eq(caseMembers.caseId, caseId), eq(caseMembers.userId, userId)))
    .get();
  if (!row) return false;
  return role ? row.role === role : true;
}
