import { withAuthorization } from "@/lib/authz";
import { deleteCase, getCase } from "@/lib/caseStore";
import { NextResponse } from "next/server";

export const GET = withAuthorization(
  "cases",
  "read",
  async (
    req: Request,
    {
      params,
    }: {
      params: Promise<{ id: string }>;
      session?: { user?: { role?: string } };
    },
  ) => {
    const { id } = await params;
    const c = getCase(id);
    if (!c) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(c);
  },
);

export const DELETE = withAuthorization(
  "cases",
  "delete",
  async (
    req: Request,
    {
      params,
    }: {
      params: Promise<{ id: string }>;
      session?: { user?: { role?: string } };
    },
  ) => {
    const { id } = await params;
    const ok = deleteCase(id);
    if (!ok) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  },
);
