import { withCaseAuthorization } from "@/lib/authz";
import { addOwnershipRequest } from "@/lib/caseStore";
import { sendSnailMail } from "@/lib/contactMethods";
import { ownershipModules } from "@/lib/ownershipModules";
import { NextResponse } from "next/server";

export const POST = withCaseAuthorization(
  "update",
  async (
    req: Request,
    {
      params,
      session,
    }: {
      params: Promise<{ id: string }>;
      session?: { user?: { id?: string; role?: string } };
    },
  ) => {
    const { id } = await params;
    const { moduleId, checkNumber, snailMail } = (await req.json()) as {
      moduleId: string;
      checkNumber?: string | null;
      snailMail?: boolean;
    };
    const updated = addOwnershipRequest(id, {
      moduleId,
      checkNumber: checkNumber ?? null,
      requestedAt: new Date().toISOString(),
    });
    if (!updated) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (snailMail) {
      const mod = ownershipModules[moduleId];
      if (mod?.address) {
        await sendSnailMail({
          address: mod.address,
          subject: "Ownership information request",
          body: `Check number: ${checkNumber ?? ""}`,
          attachments: [],
        });
      }
    }
    return NextResponse.json(updated);
  },
);
