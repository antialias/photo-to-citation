import { withCaseAuthorization } from "@/lib/authz";
import { getCase, setCaseAnalysisOverrides } from "@/lib/caseStore";
import { NextResponse } from "next/server";

export const PUT = withCaseAuthorization(
  "update",
  async (
    req: Request,
    {
      params,
      session,
    }: {
      params: Promise<{ id: string }>;
      session?: { user?: { id?: string; role?: string } };
    },
  ) => {
    const { id } = await params;
    const overrides = (await req.json()) as Record<string, unknown>;
    const updated = setCaseAnalysisOverrides(id, overrides);
    if (!updated) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const layered = getCase(id);
    return NextResponse.json(layered);
  },
);

export const DELETE = withCaseAuthorization(
  "update",
  async (
    _req: Request,
    {
      params,
      session,
    }: {
      params: Promise<{ id: string }>;
      session?: { user?: { id?: string; role?: string } };
    },
  ) => {
    const { id } = await params;
    const updated = setCaseAnalysisOverrides(id, null);
    if (!updated) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const layered = getCase(id);
    return NextResponse.json(layered);
  },
);
