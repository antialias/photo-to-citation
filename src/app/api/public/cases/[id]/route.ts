import { authorize } from "@/lib/authz";
import { getCase } from "@/lib/caseStore";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await authorize("anonymous", "public_cases", "read"))) {
    return new Response(null, { status: 403 });
  }
  const { id } = await params;
  const c = getCase(id);
  if (!c) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!c.public) {
    return new Response(null, { status: 403 });
  }
  return NextResponse.json(c);
}
