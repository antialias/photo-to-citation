import { getCase, updateCaseOverrides } from "@/lib/caseStore";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: { id: string } },
) {
  const { id } = await params;
  const c = getCase(id);
  if (!c) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(c);
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const { id } = params;
  const body = (await req.json()) as { overrides: unknown };
  const updated = updateCaseOverrides(
    id,
    (body.overrides as Partial<import("@/lib/openai").ViolationReport>) || null,
  );
  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(updated);
}
