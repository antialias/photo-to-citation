import { withAuthorization } from "@/lib/authz";
import { listJobs } from "@/lib/jobScheduler";
import { NextResponse } from "next/server";

export const GET = withAuthorization(
  { obj: "superadmin" },
  async (req: Request) => {
    const url = new URL(req.url);
    const type = url.searchParams.get("type") ?? undefined;
    const data = listJobs(type);
    return NextResponse.json(data);
  },
);
