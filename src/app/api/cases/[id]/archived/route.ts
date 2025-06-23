import { withCaseAuthorization } from "@/lib/authz";
import { getCase, setCaseArchived } from "@/lib/caseStore";
import { NextResponse } from "next/server";

export const PUT = withCaseAuthorization(
  { obj: "cases" },
  async (
    req: Request,
    {
      params,
      session: _session,
    }: {
      params: Promise<{ id: string }>;
      session?: { user?: { id?: string; role?: string } };
    },
  ) => {
    const { id } = await params;
    const { archived } = (await req.json()) as { archived: boolean };
    const updated = setCaseArchived(id, archived);
    if (!updated) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const layered = getCase(id);
    return NextResponse.json(layered);
  },
);
