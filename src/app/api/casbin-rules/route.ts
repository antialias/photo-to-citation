import {
  type CasbinRule,
  getCasbinRules,
  replaceCasbinRules,
} from "@/lib/adminStore";
import { withAuthorization } from "@/lib/authz";
import { NextResponse } from "next/server";

export const GET = withAuthorization("admin", "read", async () =>
  NextResponse.json(getCasbinRules()),
);

export const PUT = withAuthorization(
  "superadmin",
  "update",
  async (req: Request) => {
    const rules = (await req.json()) as CasbinRule[];
    const updated = replaceCasbinRules(rules);
    return NextResponse.json(updated);
  },
);
