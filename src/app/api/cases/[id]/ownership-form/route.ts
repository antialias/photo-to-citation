import fs from "node:fs";
import { withCaseAuthorization } from "@/lib/authz";
import { getCase } from "@/lib/caseStore";
import { getCaseVehicleMake, getCaseVehicleYear } from "@/lib/caseUtils";
import { fillIlForm } from "@/lib/ownershipModules";
import type { OwnershipRequestInfo } from "@/lib/ownershipModules";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withCaseAuthorization(
  { obj: "cases" },
  async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    const c = getCase(id);
    if (!c) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const state = c.analysis?.vehicle?.licensePlateState?.toLowerCase();
    if (state !== "il") {
      return NextResponse.json({ error: "unsupported" }, { status: 400 });
    }
    const search = new URL(req.url).searchParams;
    const info: Record<string, unknown> = {
      plate: c.analysis?.vehicle?.licensePlateNumber ?? "",
      state: c.analysis?.vehicle?.licensePlateState ?? "",
      vin: c.vinOverride ?? c.vin ?? undefined,
      vehicleMake: getCaseVehicleMake(c) ?? undefined,
      vehicleYear: getCaseVehicleYear(c) ?? undefined,
      reasonForRequestingRecords: "private investigation",
      reasonH: true,
    };
    for (const [k, v] of search.entries()) {
      info[k] = v;
    }
    const pdfPath = await fillIlForm(info as unknown as OwnershipRequestInfo);
    const data = fs.readFileSync(pdfPath);
    fs.rmSync(pdfPath);
    return new NextResponse(data, {
      headers: { "Content-Type": "application/pdf" },
    });
  },
);
