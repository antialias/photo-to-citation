import { reanalyzeCaseImage } from "@/lib/caseAnalysis";
import { getCase } from "@/lib/caseStore";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await req.json()) as { photo: string };
  const c = getCase(id);
  if (!c || !c.photos.includes(body.photo)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await reanalyzeCaseImage(c, body.photo);
  const updated = getCase(id);
  if (!updated)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}
