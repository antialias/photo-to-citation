import { type Enforcer, newEnforcer, newModelFromString } from "casbin";
import { getServerSession } from "next-auth/next";
import { getAnonymousSessionId } from "./anonymousSession";
import { getAuthOptions } from "./authOptions";
import { isCaseMember } from "./caseMembers";
import { getCase } from "./caseStore";
import { migrationsReady } from "./db";
import { log } from "./logger";
import { orm } from "./orm";
import { casbinRules } from "./schema";

let enforcer: Enforcer | undefined;

async function loadEnforcer(): Promise<Enforcer> {
  if (enforcer) return enforcer;
  await migrationsReady();
  log("loading casbin enforcer");
  const model = newModelFromString(`
  [request_definition]
  r = sub, obj, act, caseId, userId

  [policy_definition]
  p = sub, obj, act

  [role_definition]
  g = _, _

  [policy_effect]
  e = some(where (p.eft == allow))

  [matchers]
  m = g(r.sub, p.sub) && r.obj == p.obj && r.act == p.act && (r.caseId == "" || r.sub == "admin" || r.sub == "superadmin" || hasMember(r.caseId, r.userId))
  `);
  enforcer = await newEnforcer(model);
  enforcer.addFunction("hasMember", (caseId?: string, userId?: string) => {
    if (!caseId || !userId) return false;
    return isCaseMember(caseId, userId);
  });
  const rules = orm.select().from(casbinRules).all();
  for (const r of rules) {
    if (r.ptype === "g" && r.v0 && r.v1) enforcer.addGroupingPolicy(r.v0, r.v1);
    else if (r.ptype === "p" && r.v0 && r.v1 && r.v2)
      enforcer.addPolicy(r.v0, r.v1, r.v2);
  }
  return enforcer;
}

export async function reloadEnforcer(): Promise<Enforcer> {
  enforcer = undefined;
  return loadEnforcer();
}

export async function authorize(
  sub: string,
  obj: string,
  act: string,
  ctx?: { caseId?: string; userId?: string },
): Promise<boolean> {
  log("authorize", sub, obj, act, ctx);
  const e = await loadEnforcer();
  return e.enforce(sub, obj, act, ctx?.caseId ?? "", ctx?.userId ?? "");
}

export function getSessionDetails(
  ctx: { session?: { user?: { id?: string; role?: string } } },
  defaultRole = "anonymous",
) {
  return {
    role: ctx.session?.user?.role ?? defaultRole,
    userId: ctx.session?.user?.id,
  };
}

export async function loadAuthContext(
  ctx: { session?: { user?: { id?: string; role?: string } } },
  defaultRole = "anonymous",
) {
  const skipSessionLoad = process.env.VITEST && !process.env.TEST_APIS;
  const session = skipSessionLoad
    ? ctx.session
    : (ctx.session ?? (await getServerSession(getAuthOptions())) ?? undefined);
  const { role, userId } = getSessionDetails({ session }, defaultRole);
  return { session, role, userId };
}

/**
 * Wraps an API handler with a generic authorization check.
 *
 * Loads the current session, retrieves the user role, and verifies the
 * `(obj, act)` pair using Casbin before executing the handler.
 */
const methodToAct = {
  GET: "read",
  POST: "create",
  PUT: "update",
  PATCH: "update",
  DELETE: "delete",
} as const;

export function withAuthorization<
  C extends {
    params: Promise<Record<string, string>>;
    session?: { user?: { role?: string } };
  },
  R = Response,
>(
  opts: { obj: string; act?: string },
  handler: (req: Request, ctx: C) => Promise<R> | R,
) {
  return async (req: Request, ctx: C): Promise<R | Response> => {
    const { session, role } = await loadAuthContext(ctx);
    const { obj } = opts;
    const act = opts.act ?? methodToAct[req.method as keyof typeof methodToAct];
    log("withAuthorization", role, obj, act);
    if (!(await authorize(role, obj, act))) {
      return new Response(null, { status: 403 });
    }
    return handler(req, { ...ctx, session } as C);
  };
}

/**
 * Wraps an API handler with case-specific authorization logic.
 *
 * Ensures the user is authenticated, verifies membership of the case, and
 * checks the provided action against the "cases" resource before executing
 * the handler.
 */
export function withCaseAuthorization<
  C extends {
    params: Promise<{ id: string } & Record<string, string>>;
    session?: { user?: { id?: string; role?: string } };
  },
  R = Response,
>(
  opts: { obj: string; act?: string },
  handler: (req: Request, ctx: C) => Promise<R> | R,
) {
  return async (req: Request, ctx: C): Promise<R | Response> => {
    const { id } = await ctx.params;
    const { session, role, userId } = await loadAuthContext(ctx, "user");
    const caseData = getCase(id);
    const anonSessionId = getAnonymousSessionId(req);
    const sessionMatch =
      anonSessionId &&
      caseData?.sessionId &&
      caseData.sessionId === anonSessionId;
    const { obj } = opts;
    const act = opts.act ?? methodToAct[req.method as keyof typeof methodToAct];
    log("withCaseAuthorization", role, obj, act, id, userId);
    const authRole = sessionMatch ? "user" : role;
    const authCtx = sessionMatch ? undefined : { caseId: id, userId };
    if (!(await authorize(authRole, obj, act, authCtx))) {
      return new Response(null, { status: 403 });
    }
    return handler(req, { ...ctx, session } as C);
  };
}
