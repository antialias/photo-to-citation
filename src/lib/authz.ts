import { type Enforcer, newEnforcer, newModelFromString } from "casbin";
import { migrationsReady } from "./db";
import { orm } from "./orm";
import { casbinRules } from "./schema";

let enforcer: Enforcer | undefined;

async function loadEnforcer(): Promise<Enforcer> {
  if (enforcer) return enforcer;
  await migrationsReady;
  const model = newModelFromString(`
  [request_definition]
  r = sub, obj, act

  [policy_definition]
  p = sub, obj, act

  [role_definition]
  g = _, _

  [policy_effect]
  e = some(where (p.eft == allow))

  [matchers]
  m = g(r.sub, p.sub) && r.obj == p.obj && r.act == p.act
  `);
  enforcer = await newEnforcer(model);
  const rules = orm.select().from(casbinRules).all();
  for (const r of rules) {
    if (r.ptype === "g" && r.v0 && r.v1) enforcer.addGroupingPolicy(r.v0, r.v1);
    else if (r.ptype === "p" && r.v0 && r.v1 && r.v2)
      enforcer.addPolicy(r.v0, r.v1, r.v2);
  }
  return enforcer;
}

export async function authorize(
  sub: string,
  obj: string,
  act: string,
): Promise<boolean> {
  const e = await loadEnforcer();
  return e.enforce(sub, obj, act);
}

export function withAuthorization(
  obj: string,
  act: string,
  handler: (
    req: Request,
    ctx: { session?: { user?: { role?: string } } },
  ) => Promise<Response> | Response,
) {
  return async (
    req: Request,
    ctx: { session?: { user?: { role?: string } } },
  ) => {
    const role = ctx.session?.user?.role ?? "user";
    if (!(await authorize(role, obj, act))) {
      return new Response(null, { status: 403 });
    }
    return handler(req, ctx);
  };
}
