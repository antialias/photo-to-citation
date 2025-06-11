import { addOwnershipRequest } from "@/lib/caseStore";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { moduleId, checkNumber } = (await req.json()) as {
    moduleId: string;
    checkNumber?: string | null;
  };
  const updated = addOwnershipRequest(id, {
    moduleId,
    checkNumber: checkNumber ?? null,
    requestedAt: new Date().toISOString(),
  });
  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(updated);
}
