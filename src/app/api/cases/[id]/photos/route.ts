import { analyzeCaseInBackground } from "@/lib/caseAnalysis";
import { addCasePhoto, getCase, removeCasePhoto } from "@/lib/caseStore";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
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

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { photo, takenAt, gps } = (await req.json()) as {
    photo: string;
    takenAt?: string | null;
    gps?: { lat: number; lon: number } | null;
  };
  const updated = addCasePhoto(id, photo, takenAt, gps ?? null);
  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  analyzeCaseInBackground(updated);
  const layered = getCase(id);
  return NextResponse.json(layered);
}
