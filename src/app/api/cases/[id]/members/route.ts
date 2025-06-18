import { withAuthorization } from "@/lib/authz";
import { listCaseMembers } from "@/lib/caseMembers";
import { getCase } from "@/lib/caseStore";
import { NextResponse } from "next/server";

export const GET = withAuthorization(
  "cases",
  "read",
  async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    const c = getCase(id);
    if (!c) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(listCaseMembers(id));
  },
);
