import {
  type CasbinRule,
  addCasbinRule,
  deleteCasbinRule,
  getCasbinRules,
  replaceCasbinRules,
  updateCasbinRule,
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

export const POST = withAuthorization(
  { obj: "superadmin", act: "update" },
  async (
    req: Request,
    _ctx: {
      params: Promise<Record<string, string>>;
      session?: { user?: { role?: string } };
    },
  ) => {
    const rule = (await req.json()) as CasbinRule;
    const updated = await addCasbinRule(rule);
    return NextResponse.json(updated);
  },
);

export const PATCH = withAuthorization(
  { obj: "superadmin", act: "update" },
  async (
    req: Request,
    _ctx: {
      params: Promise<Record<string, string>>;
      session?: { user?: { role?: string } };
    },
  ) => {
    const { oldRule, newRule } = (await req.json()) as {
      oldRule: CasbinRule;
      newRule: CasbinRule;
    };
    const updated = await updateCasbinRule(oldRule, newRule);
    return NextResponse.json(updated);
  },
);

export const DELETE = withAuthorization(
  { obj: "superadmin", act: "update" },
  async (
    req: Request,
    _ctx: {
      params: Promise<Record<string, string>>;
      session?: { user?: { role?: string } };
    },
  ) => {
    const rule = (await req.json()) as CasbinRule;
    const updated = await deleteCasbinRule(rule);
    return NextResponse.json(updated);
  },
);
