import { withCaseAuthorization } from "@/lib/authz";
import { getCase, setPhotoNote } from "@/lib/caseStore";
import { NextResponse } from "next/server";

export const PUT = withCaseAuthorization(
  { obj: "cases", act: "update" },
  async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    const { photo, note } = (await req.json()) as {
      photo: string;
      note: string | null;
    };
    const updated = setPhotoNote(id, photo, note);
    if (!updated) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const layered = getCase(id);
    return NextResponse.json(layered);
  },
);
