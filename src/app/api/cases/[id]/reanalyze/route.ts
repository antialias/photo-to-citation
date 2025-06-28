import { withCaseAuthorization } from "@/lib/authz";
import {
  analyzeCaseInBackground,
  cancelCaseAnalysis,
} from "@/lib/caseAnalysis";
import { getCase, updateCase } from "@/lib/caseStore";
import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";

export const POST = withCaseAuthorization(
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
    analyzeCaseInBackground(updated, storedLang);
    const layered = getCase(id);
    return NextResponse.json(layered);
  },
);
