import { withAuthorization } from "@/lib/authz";
import { getCase, setCaseAnalysisOverrides } from "@/lib/caseStore";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const PUT = withAuthorization(
  "cases",
  "update",
  async (
    req: NextRequest,
    {
      params,
    }: {
      params: Promise<{ id: string }>;
      session?: { user?: { role?: string } };
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

export const DELETE = withAuthorization(
  "cases",
  "update",
  async (
    _req: NextRequest,
    {
      params,
    }: {
      params: Promise<{ id: string }>;
      session?: { user?: { role?: string } };
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
