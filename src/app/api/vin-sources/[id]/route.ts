import { getVinSourceStatuses, setVinSourceEnabled } from "@/lib/vinSources";
import { NextResponse } from "next/server";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { enabled } = (await req.json()) as { enabled: boolean };
  const result = setVinSourceEnabled(id, enabled);
  if (!result) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(getVinSourceStatuses());
}
