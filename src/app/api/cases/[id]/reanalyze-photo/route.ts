import { withCaseAuthorization } from "@/lib/authz";
import {
  analyzePhotoInBackground,
  cancelCaseAnalysis,
  cancelPhotoAnalysis,
  isCaseAnalysisActive,
} from "@/lib/caseAnalysis";
import { getCase, updateCase } from "@/lib/caseStore";
import { NextResponse } from "next/server";

export const POST = withCaseAuthorization(
  { obj: "cases", act: "update" },
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
    const url = new URL(req.url);
    const photo = url.searchParams.get("photo");
    if (!photo) {
      return NextResponse.json({ error: "Missing photo" }, { status: 400 });
    }
    const c = getCase(id);
    if (!c || !c.photos.includes(photo)) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (isCaseAnalysisActive(id)) {
      return NextResponse.json(
        {
          error:
            "Individual photo reanalysis is blocked until the case job finishes or is canceled.",
        },
        { status: 409 },
      );
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
