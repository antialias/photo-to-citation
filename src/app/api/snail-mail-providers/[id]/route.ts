import { withAuthorization } from "@/lib/authz";
import {
  getSnailMailProviderStatuses,
  setActiveSnailMailProvider,
} from "@/lib/snailMailProviders";
import { NextResponse } from "next/server";

export const PUT = withAuthorization(
  "admin",
  "update",
  async (
    _req: Request,
    {
      params,
    }: {
      params: Promise<{ id: string }>;
      session?: { user?: { role?: string } };
    },
  ) => {
    const { id } = await params;
    const result = setActiveSnailMailProvider(id);
    if (!result) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(getSnailMailProviderStatuses());
  },
);
