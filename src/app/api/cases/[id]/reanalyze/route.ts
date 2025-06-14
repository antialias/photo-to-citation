import {
  analyzeCaseInBackground,
  cancelCaseAnalysis,
} from "@/lib/caseAnalysis";
import { getCase, updateCase } from "@/lib/caseStore";
import { NextResponse } from "next/server";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
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
}
