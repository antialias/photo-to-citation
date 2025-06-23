import { authorize } from "@/lib/authz";
import { getCase } from "@/lib/caseStore";
import { listJobs } from "@/lib/jobScheduler";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await authorize("anonymous", "public_cases", "read"))) {
    return new Response(null, { status: 403 });
  }
  const { id } = await params;
  const c = getCase(id);
  if (!c || !c.public) {
    return new Response(null, { status: 403 });
  }
  const url = new URL(req.url);
  const type = url.searchParams.get("type") ?? undefined;
  const data = listJobs(type, id);
  return NextResponse.json(data);
}
