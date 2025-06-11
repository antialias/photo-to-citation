import { getCase, setCaseVinOverride } from "@/lib/caseStore";
import { NextResponse } from "next/server";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { vin } = (await req.json()) as { vin: string | null };
  const updated = setCaseVinOverride(id, vin);
  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const layered = getCase(id);
  return NextResponse.json(layered);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const updated = setCaseVinOverride(id, null);
  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const layered = getCase(id);
  return NextResponse.json(layered);
}
