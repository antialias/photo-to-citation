import { getServerSession } from "next-auth/next";
import { cookies } from "next/headers";
import { authOptions } from "./authOptions";
import { authorize } from "./authz";
import { isCaseMember } from "./caseMembers";
import { getCase } from "./caseStore";

export async function getAuthorizedCase(id: string) {
  const c = getCase(id);
  if (!c) return null;
  const session = await getServerSession(authOptions);
  const cookieStore = await cookies();
  const anonId =
    cookieStore.get("anon_session_id")?.value ??
    cookieStore.get("anonSession")?.value;
  const role = session?.user?.role ?? "anonymous";
  const userId = session?.user?.id;
  const sessionMatch = anonId && c.sessionId && c.sessionId === anonId;
  const authRole = sessionMatch ? "user" : role;
  const obj = c.public ? "public_cases" : "cases";
  if (!(await authorize(authRole, obj, "read"))) {
    return null;
  }
  if (!c.public && role !== "admin" && role !== "superadmin") {
    if (!(sessionMatch || (userId && isCaseMember(id, userId)))) {
      return null;
    }
  }
  return c;
}
