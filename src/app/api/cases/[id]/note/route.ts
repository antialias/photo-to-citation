import { withCaseAuthorization } from "@/lib/authz";
import { getCase, setCaseNote } from "@/lib/caseStore";
import { NextResponse } from "next/server";

export const PUT = withCaseAuthorization(
  { obj: "cases", act: "update" },
  async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    const { note } = (await req.json()) as { note: string | null };
    const updated = setCaseNote(id, note);
    if (!updated) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const layered = getCase(id);
    return NextResponse.json(layered);
  },
);
