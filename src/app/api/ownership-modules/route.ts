import { withAuthorization } from "@/lib/authz";
import { getOwnershipModuleStatuses } from "@/lib/ownershipModules";
import { NextResponse } from "next/server";

export const GET = withAuthorization({ obj: "ownership_modules" }, async () => {
  const list = getOwnershipModuleStatuses();
  return NextResponse.json(list);
});
