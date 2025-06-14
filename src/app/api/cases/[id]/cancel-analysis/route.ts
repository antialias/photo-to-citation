import { cancelCaseAnalysis } from "@/lib/caseAnalysis";
import { getCase } from "@/lib/caseStore";
import { NextResponse } from "next/server";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const ok = cancelCaseAnalysis(id);
  const c = getCase(id);
  if (!c) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!ok) return NextResponse.json(c);
  const layered = getCase(id);
  return NextResponse.json(layered);
}
