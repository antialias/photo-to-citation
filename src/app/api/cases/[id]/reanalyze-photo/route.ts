import {
  analyzePhotoInBackground,
  cancelCaseAnalysis,
  cancelPhotoAnalysis,
} from "@/lib/caseAnalysis";
import { getCase, updateCase } from "@/lib/caseStore";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
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
  cancelCaseAnalysis(id);
  cancelPhotoAnalysis(id, photo);
  const updated = updateCase(id, {
    analysisStatus: "pending",
    analysisProgress: { stage: "upload", index: 0, total: 1 },
  });
  analyzePhotoInBackground(updated || c, photo);
  return NextResponse.json(getCase(id));
}
