import { withCaseAuthorization } from "@/lib/authz";
import { getCase, setCaseViolationOverride } from "@/lib/caseStore";
import { NextResponse } from "next/server";

export const PUT = withCaseAuthorization(
  { obj: "cases" },
  async (
    req: Request,
    {
      params,
      session: _session,
    }: {
      params: Promise<{ id: string }>;
      session?: { user?: { id?: string; role?: string } };
    },
  ) => {
    const { id } = await params;
    const { violation, reason } = (await req.json()) as {
      violation: boolean | null;
      reason: string | null;
    };
    const updated = setCaseViolationOverride(id, violation, reason);
    if (!updated) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const layered = getCase(id);
    return NextResponse.json(layered);
  },
);

export const DELETE = withCaseAuthorization(
  { obj: "cases", act: "update" },
  async (
    _req: Request,
    {
      params,
      session: _session,
    }: {
      params: Promise<{ id: string }>;
      session?: { user?: { id?: string; role?: string } };
    },
  ) => {
    const { id } = await params;
    const updated = setCaseViolationOverride(id, null, null);
    if (!updated) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const layered = getCase(id);
    return NextResponse.json(layered);
  },
);
