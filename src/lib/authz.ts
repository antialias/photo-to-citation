import { type Enforcer, newEnforcer, newModelFromString } from "casbin";
import { isCaseMember } from "./caseMembers";
import { migrationsReady } from "./db";
import { orm } from "./orm";
import { casbinRules } from "./schema";

let enforcer: Enforcer | undefined;

async function loadEnforcer(): Promise<Enforcer> {
  if (enforcer) return enforcer;
  await migrationsReady;
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
  const e = await loadEnforcer();
  return e.enforce(sub, obj, act, ctx?.caseId ?? "", ctx?.userId ?? "");
}

export function withAuthorization<
  C extends {
    params: Promise<Record<string, string>>;
    session?: { user?: { role?: string } };
  },
  R = Response,
>(obj: string, act: string, handler: (req: Request, ctx: C) => Promise<R> | R) {
  return async (req: Request, ctx: C): Promise<R | Response> => {
    const role = ctx.session?.user?.role ?? "user";
    if (!(await authorize(role, obj, act))) {
      return new Response(null, { status: 403 });
    }
    return handler(req, ctx);
  };
}

export function withCaseAuthorization<
  C extends {
    params: Promise<{ id: string } & Record<string, string>>;
    session?: { user?: { id?: string; role?: string } };
  },
  R = Response,
>(act: string, handler: (req: Request, ctx: C) => Promise<R> | R) {
  return async (req: Request, ctx: C): Promise<R | Response> => {
    const { id } = await ctx.params;
    const role = ctx.session?.user?.role ?? "user";
    const userId = ctx.session?.user?.id;
    if (!(await authorize(role, "cases", act, { caseId: id, userId }))) {
      return new Response(null, { status: 403 });
    }
    return handler(req, ctx);
  };
}
