import { analyzeCaseInBackground } from "@/lib/caseAnalysis";
import { getCase, removeCasePhoto } from "@/lib/caseStore";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = await params;
  const { photo } = (await req.json()) as { photo: string };
  const updated = removeCasePhoto(id, photo);
  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  analyzeCaseInBackground(updated);
  const layered = getCase(id);
  return NextResponse.json(layered);
}
