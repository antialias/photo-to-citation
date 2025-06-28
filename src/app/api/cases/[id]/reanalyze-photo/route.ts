import { withCaseAuthorization } from "@/lib/authz";
import {
  analyzePhotoInBackground,
  cancelCaseAnalysis,
  cancelPhotoAnalysis,
  isCaseAnalysisActive,
} from "@/lib/caseAnalysis";
import { getCase, updateCase } from "@/lib/caseStore";
import { cookies, headers } from "next/headers";
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
    const store = await cookies();
    let storedLang = store.get("language")?.value;
    if (!storedLang) {
      const headerList = await headers();
      const accept = headerList.get("accept-language") ?? "";
      const supported = ["en", "es", "fr"];
      for (const part of accept.split(",")) {
        const code = part.split(";")[0].trim().toLowerCase().split("-")[0];
        if (supported.includes(code)) {
          storedLang = code;
          break;
        }
      }
      storedLang = storedLang ?? "en";
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
    analyzePhotoInBackground(updated || c, photo, storedLang);
    return NextResponse.json(getCase(id));
  },
);
