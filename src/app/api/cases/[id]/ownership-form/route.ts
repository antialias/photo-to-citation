import fs from "node:fs";
import { getSessionDetails, withCaseAuthorization } from "@/lib/authz";
import { getCase } from "@/lib/caseStore";
import { config } from "@/lib/config";
import { fillIlForm, type OwnershipRequestInfo } from "@/lib/ownershipModules";
import { getUser } from "@/lib/userStore";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withCaseAuthorization(
  { obj: "cases" },
  async (
    _req: Request,
    {
      params,
      session,
    }: {
      params: Promise<{ id: string }>;
      session?: { user?: { id?: string } };
    },
  ) => {
    const { id } = await params;
    const c = getCase(id);
    if (!c) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const state = c.analysis?.vehicle?.licensePlateState?.toLowerCase();
    if (state !== "il") {
      return NextResponse.json({ error: "unsupported" }, { status: 400 });
    }
    const { userId } = getSessionDetails({ session }, "user");
    const user = userId ? getUser(userId) : null;
    const addr = config.RETURN_ADDRESS
      ? (() => {
          const lines = config.RETURN_ADDRESS.split(/\n+/);
          const name = lines.length > 3 ? lines.shift() : undefined;
          const address1 = lines.shift() || "";
          const possibleCity = lines.pop() || "";
          const address2 = lines.length > 0 ? lines.shift() : undefined;
          const m = possibleCity.match(
            /^(.*),\s*([A-Z]{2})\s+(\d{5}(?:-\d{4})?)/,
          );
          const city = m ? m[1] : "";
          const state2 = m ? m[2] : "";
          const postalCode = m ? m[3] : "";
          return { name, address1, address2, city, state: state2, postalCode };
        })()
      : null;
    const cityStateZip = addr
      ? `${addr.city}, ${addr.state} ${addr.postalCode}`.trim()
      : "";
    const info: OwnershipRequestInfo = {
      plate: c.analysis?.vehicle?.licensePlateNumber ?? "",
      state: c.analysis?.vehicle?.licensePlateState ?? "",
      vin: c.vinOverride ?? c.vin ?? undefined,
      requesterName: user?.name ?? undefined,
      requesterBusinessName: addr?.name ?? undefined,
      requesterAddress: addr
        ? [addr.address1, addr.address2].filter(Boolean).join(" ")
        : undefined,
      requesterCityStateZip: cityStateZip || undefined,
      requesterEmailAddress: user?.email ?? undefined,
    };
    const pdfPath = await fillIlForm(info);
    const data = fs.readFileSync(pdfPath);
    fs.rmSync(pdfPath);
    return new NextResponse(data, {
      headers: { "Content-Type": "application/pdf" },
    });
  },
);
