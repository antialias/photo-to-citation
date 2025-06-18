import { withAuthorization } from "@/lib/authz";
import {
  analyzeCaseInBackground,
  cancelCaseAnalysis,
} from "@/lib/caseAnalysis";
import { isCaseMember } from "@/lib/caseMembers";
import { getCase, updateCase } from "@/lib/caseStore";
import { NextResponse } from "next/server";

export const POST = withAuthorization(
  "cases",
  "read",
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
    const userId = session?.user?.id;
    const role = session?.user?.role ?? "user";
    if (
      role !== "admin" &&
      role !== "superadmin" &&
      (!userId || !isCaseMember(id, userId))
    ) {
      return new Response(null, { status: 403 });
    }
    const c = getCase(id);
    if (!c) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    cancelCaseAnalysis(id);
    const updated = updateCase(id, {
      analysisStatus: "pending",
      analysisProgress: { stage: "upload", index: 0, total: c.photos.length },
    });
    if (!updated) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    analyzeCaseInBackground(updated);
    const layered = getCase(id);
    return NextResponse.json(layered);
  },
);
