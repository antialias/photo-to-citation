import { getCase, setCaseAnalysisOverrides } from "@/lib/caseStore";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const overrides = (await req.json()) as Record<string, unknown>;
  const updated = setCaseAnalysisOverrides(params.id, overrides);
  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const layered = getCase(params.id);
  return NextResponse.json(layered);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const updated = setCaseAnalysisOverrides(params.id, null);
  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const layered = getCase(params.id);
  return NextResponse.json(layered);
}
