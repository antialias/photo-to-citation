import { withCaseAuthorization } from "@/lib/authz";
import { isCaseAnalysisActive } from "@/lib/caseAnalysis";
import { NextResponse } from "next/server";

export const GET = withCaseAuthorization(
  { obj: "cases" },
  async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    return NextResponse.json({ active: isCaseAnalysisActive(id) });
  },
);
