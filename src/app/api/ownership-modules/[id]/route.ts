import { withAuthorization } from "@/lib/authz";
import {
  getOwnershipModuleStatuses,
  setOwnershipModuleEnabled,
} from "@/lib/ownershipModules";
import { NextResponse } from "next/server";

export const PUT = withAuthorization(
  { obj: "ownership_modules", act: "update" },
  async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    const { enabled } = (await req.json()) as { enabled: boolean };
    const result = setOwnershipModuleEnabled(id, enabled);
    if (!result) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(getOwnershipModuleStatuses());
  },
);
