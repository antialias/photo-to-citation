import fs from "node:fs";

import { withCaseAuthorization } from "@/lib/authz";
import { getCase } from "@/lib/caseStore";
import {
  getCasePlateNumber,
  getCasePlateState,
  getCaseVin,
} from "@/lib/caseUtils";
import { fillIlForm } from "@/lib/ownershipModules";

export const GET = withCaseAuthorization(
  { obj: "cases" },
  async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    const c = getCase(id);
    if (!c) return new Response(null, { status: 404 });
    const state = getCasePlateState(c)?.toLowerCase();
    if (state !== "il") {
      return new Response("Unsupported", { status: 400 });
    }
    const pdfPath = await fillIlForm({
      plate: getCasePlateNumber(c) ?? "",
      state: state.toUpperCase(),
      vin: getCaseVin(c),
    });
    const bytes = fs.readFileSync(pdfPath);
    return new Response(bytes, {
      headers: { "Content-Type": "application/pdf" },
    });
  },
);
