import { getCase, setCaseAnalysisOverrides } from "@/lib/caseStore";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = await params;
  const overrides = (await req.json()) as Record<string, unknown>;
  const updated = setCaseAnalysisOverrides(id, overrides);
  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const layered = getCase(id);
  return NextResponse.json(layered);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = await params;
  const updated = setCaseAnalysisOverrides(id, null);
  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const layered = getCase(id);
  return NextResponse.json(layered);
}
