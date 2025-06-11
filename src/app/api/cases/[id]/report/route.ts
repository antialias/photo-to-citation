import { draftEmail } from "@/lib/caseReport";
import { getCase } from "@/lib/caseStore";
import { reportModules } from "@/lib/reportModules";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const { id } = await params;
  const c = getCase(id);
  if (!c) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const module = reportModules["oak-park"];
  const email = await draftEmail(c, module);
  return NextResponse.json({ email, attachments: c.photos, module });
}
