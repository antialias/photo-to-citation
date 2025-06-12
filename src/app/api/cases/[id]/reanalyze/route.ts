import { analyzeCaseInBackground } from "@/lib/caseAnalysis";
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
  const updated = updateCase(id, { analysisStatus: "pending" });
  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  analyzeCaseInBackground(updated);
  const layered = getCase(id);
  return NextResponse.json(layered);
}
