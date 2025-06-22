import {
  type CasbinRule,
  getCasbinRules,
  replaceCasbinRules,
} from "@/lib/adminStore";
import { withAuthorization } from "@/lib/authz";
import { NextResponse } from "next/server";

export const GET = withAuthorization(
  { obj: "admin" },
  async (
    _req: Request,
    _ctx: {
      params: Promise<Record<string, string>>;
      session?: { user?: { role?: string } };
    },
  ) => NextResponse.json(getCasbinRules()),
);

export const PUT = withAuthorization(
  { obj: "superadmin" },
  async (
    req: Request,
    _ctx: {
      params: Promise<Record<string, string>>;
      session?: { user?: { role?: string } };
    },
  ) => {
    const rules = (await req.json()) as CasbinRule[];
    const updated = await replaceCasbinRules(rules);
    return NextResponse.json(updated);
  },
);
