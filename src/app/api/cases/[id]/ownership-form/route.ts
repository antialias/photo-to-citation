import fs from "node:fs";
import { withCaseAuthorization } from "@/lib/authz";
import { getCase } from "@/lib/caseStore";
import { fillIlForm } from "@/lib/ownershipModules";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withCaseAuthorization(
  { obj: "cases" },
  async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    const c = getCase(id);
    if (!c) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const state = c.analysis?.vehicle?.licensePlateState?.toLowerCase();
    if (state !== "il") {
      return NextResponse.json({ error: "unsupported" }, { status: 400 });
    }
    const info = {
      plate: c.analysis?.vehicle?.licensePlateNumber ?? "",
      state: c.analysis?.vehicle?.licensePlateState ?? "",
      vin: c.vinOverride ?? c.vin ?? undefined,
    };
    const pdfPath = await fillIlForm(info);
    const data = fs.readFileSync(pdfPath);
    fs.rmSync(pdfPath);
    return new NextResponse(data, {
      headers: { "Content-Type": "application/pdf" },
    });
  },
);

export const POST = withCaseAuthorization(
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
    const updates = (await req.json()) as Partial<
      import("@/lib/ownershipModules").OwnershipRequestInfo
    >;
    const info = {
      plate: c.analysis?.vehicle?.licensePlateNumber ?? "",
      state: c.analysis?.vehicle?.licensePlateState ?? "",
      vin: c.vinOverride ?? c.vin ?? undefined,
      ...updates,
    };
    const pdfPath = await fillIlForm(info);
    const data = fs.readFileSync(pdfPath);
    fs.rmSync(pdfPath);
    return new NextResponse(data, {
      headers: { "Content-Type": "application/pdf" },
    });
  },
);
