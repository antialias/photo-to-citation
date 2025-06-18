import { withAuthorization } from "@/lib/authz";
import {
  analyzePhotoInBackground,
  cancelCaseAnalysis,
  cancelPhotoAnalysis,
} from "@/lib/caseAnalysis";
import { isCaseMember } from "@/lib/caseMembers";
import { getCase, updateCase } from "@/lib/caseStore";
import { NextResponse } from "next/server";

export const POST = withAuthorization(
  "cases",
  "read",
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
    const userId = session?.user?.id;
    const role = session?.user?.role ?? "user";
    if (
      role !== "admin" &&
      role !== "superadmin" &&
      (!userId || !isCaseMember(id, userId))
    ) {
      return new Response(null, { status: 403 });
    }
    const url = new URL(req.url);
    const photo = url.searchParams.get("photo");
    if (!photo) {
      return NextResponse.json({ error: "Missing photo" }, { status: 400 });
    }
    const c = getCase(id);
    if (!c || !c.photos.includes(photo)) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    cancelCaseAnalysis(id);
    cancelPhotoAnalysis(id, photo);
    const updated = updateCase(id, {
      analysisStatus: "pending",
      analysisProgress: { stage: "upload", index: 0, total: 1 },
    });
    analyzePhotoInBackground(updated || c, photo);
    return NextResponse.json(getCase(id));
  },
);
