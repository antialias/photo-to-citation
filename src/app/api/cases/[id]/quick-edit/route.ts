import { withCaseAuthorization } from "@/lib/authz";
import {
  appendCaseNote,
  getCase,
  setCaseAnalysisOverrides,
  setCaseVinOverride,
} from "@/lib/caseStore";
import { NextResponse } from "next/server";

export const POST = withCaseAuthorization(
  { obj: "cases", act: "update" },
  async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    const { field, value } = (await req.json()) as {
      field: string;
      value: string;
    };
    let updated: unknown;
    switch (field) {
      case "vin":
        updated = setCaseVinOverride(id, value || null);
        break;
      case "plate":
        updated = setCaseAnalysisOverrides(id, {
          vehicle: { licensePlateNumber: value || undefined },
        });
        break;
      case "state":
        updated = setCaseAnalysisOverrides(id, {
          vehicle: { licensePlateState: value || undefined },
        });
        break;
      case "note":
        updated = appendCaseNote(id, value);
        break;
      default:
        return NextResponse.json({ error: "Invalid field" }, { status: 400 });
    }
    if (!updated) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const layered = getCase(id);
    return NextResponse.json(layered);
  },
);
