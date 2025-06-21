import { withCaseAuthorization } from "@/lib/authz";
import { cancelCaseAnalysis } from "@/lib/caseAnalysis";
import { getCase } from "@/lib/caseStore";
import { NextResponse } from "next/server";

export const POST = withCaseAuthorization(
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
    const ok = cancelCaseAnalysis(id);
    const c = getCase(id);
    if (!c) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!ok) return NextResponse.json(c);
    const layered = getCase(id);
    return NextResponse.json(layered);
  },
);
