import { withCaseAuthorization } from "@/lib/authz";
import { addOwnershipRequest, getCase } from "@/lib/caseStore";
import { sendSnailMail } from "@/lib/contactMethods";
import { ownershipModules } from "@/lib/ownershipModules";
import { NextResponse } from "next/server";

export const POST = withCaseAuthorization(
  { obj: "cases", act: "update" },
  async (
    req: Request,
    {
      params,
      session: _session,
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
        let attachments: string[] = [];
        if (mod.generateForms) {
          const c = getCase(id);
          if (c) {
            const info = {
              plate: c.analysis?.vehicle?.licensePlateNumber ?? "",
              state: c.analysis?.vehicle?.licensePlateState ?? "",
              vin: c.vinOverride ?? c.vin ?? undefined,
            };
            const result = await mod.generateForms(info);
            attachments = attachments.concat(
              Array.isArray(result) ? result : [result],
            );
          }
        }
        await sendSnailMail({
          address: mod.address,
          subject: "Ownership information request",
          body: `Check number: ${checkNumber ?? ""}`,
          attachments,
        });
      }
    }
    return NextResponse.json(updated);
  },
);
