import { withCaseAuthorization } from "@/lib/authz";
import { addOwnershipRequest, getCase } from "@/lib/caseStore";
import {
  getCaseOwnerContactInfo,
  getCasePlateNumber,
  getCasePlateState,
  getCaseVin,
} from "@/lib/caseUtils";
import { sendSnailMail } from "@/lib/contactMethods";
import {
  type OwnershipRequestInfo,
  ownershipModules,
} from "@/lib/ownershipModules";
import { NextResponse } from "next/server";

function parseAddress(text: string) {
  const lines = text.trim().split(/\n+/);
  let name: string | undefined;
  if (lines.length > 3) name = lines.shift();
  const address1 = lines.shift() || "";
  const possibleCity = lines.pop() || "";
  const address2 = lines.length > 0 ? lines.shift() : undefined;
  const m = possibleCity.match(/^(.*),\s*([A-Z]{2})\s+(\d{5}(?:-\d{4})?)/);
  const city = m ? m[1] : "";
  const state = m ? m[2] : "";
  const postalCode = m ? m[3] : "";
  return { name, address1, address2, city, state, postalCode };
}

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
      if (mod) {
        const plate = getCasePlateNumber(updated) ?? "";
        const state = getCasePlateState(updated) ?? "";
        const vin = getCaseVin(updated);
        const contact = getCaseOwnerContactInfo(updated);
        const info: OwnershipRequestInfo = { plate, state, vin };
        if (contact?.address) {
          Object.assign(info, parseAddress(contact.address));
        }
        if (mod.requestContactInfo && vin) {
          await mod.requestContactInfo(info);
        } else if (mod.requestVin) {
          await mod.requestVin(info);
        } else if (mod.address) {
          await sendSnailMail({
            address: mod.address,
            subject: "Ownership information request",
            body: `Check number: ${checkNumber ?? ""}`,
            attachments: [],
          });
        }
      }
    }
    return NextResponse.json(updated);
  },
);
