import fs from "node:fs";
import path from "node:path";

import { NextResponse } from "next/server";

import { withCaseAuthorization } from "@/lib/authz";
import { addCaseEmail, addOwnershipRequest, getCase } from "@/lib/caseStore";
import type { SentEmail } from "@/lib/caseStore";
import { getCaseVehicleMake, getCaseVehicleYear } from "@/lib/caseUtils";
import { config } from "@/lib/config";
import { sendSnailMail } from "@/lib/contactMethods";
import { ownershipModules } from "@/lib/ownershipModules";
import type { OwnershipRequestInfo } from "@/lib/ownershipModules";
import { getUser } from "@/lib/userStore";

export const POST = withCaseAuthorization(
  { obj: "cases", act: "update" },
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
    const { moduleId, checkNumber, snailMail, form } = (await req.json()) as {
      moduleId: string;
      checkNumber?: string | null;
      snailMail?: boolean;
      form?: Record<string, unknown>;
    };
    const updated = addOwnershipRequest(id, {
      moduleId,
      checkNumber: checkNumber ?? null,
      requestedAt: new Date().toISOString(),
    });
    if (!updated) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const mod = ownershipModules[moduleId];
    let attachments: string[] = [];
    if (mod?.generateForms) {
      const c = getCase(id);
      if (c) {
        const user = session?.user?.id ? getUser(session.user.id) : null;
        const addrLines = (config.RETURN_ADDRESS || "").split(/\n+/);
        const info: Record<string, unknown> = {
          plate: c.analysis?.vehicle?.licensePlateNumber ?? "",
          state: c.analysis?.vehicle?.licensePlateState ?? "",
          vin: c.vinOverride ?? c.vin ?? undefined,
          vehicleMake: getCaseVehicleMake(c) ?? undefined,
          vehicleYear: getCaseVehicleYear(c) ?? undefined,
          requesterName: user?.name ?? addrLines[0] ?? "",
          requesterAddress: addrLines[1] ?? "",
          requesterCityStateZip: addrLines[2] ?? "",
          requesterEmailAddress: user?.email ?? undefined,
          reasonForRequestingRecords: "private investigation",
          reasonH: true,
        } as Partial<OwnershipRequestInfo>;
        if (form) {
          Object.assign(info, form);
        }
        const result = await mod.generateForms(
          info as unknown as OwnershipRequestInfo,
        );
        attachments = attachments.concat(
          Array.isArray(result) ? result : [result],
        );
      }
    }
    const results: Record<string, { success: boolean; error?: string }> = {};
    let snailMailStatus: SentEmail["snailMailStatus"];
    if (snailMail && mod?.address) {
      try {
        const res = await sendSnailMail({
          address: mod.address,
          subject: "Ownership information request",
          body: `Check number: ${checkNumber ?? ""}`,
          attachments,
        });
        snailMailStatus = res.status as SentEmail["snailMailStatus"];
        results.snailMail = { success: true };
      } catch (err) {
        console.error("Failed to send snail mail", err);
        results.snailMail = { success: false, error: (err as Error).message };
        snailMailStatus = "error";
      }
    }
    const storedAttachments: string[] = [];
    for (const att of attachments) {
      if (path.isAbsolute(att)) {
        const dest = path.join(config.UPLOAD_DIR, path.basename(att));
        try {
          fs.copyFileSync(att, dest);
          storedAttachments.push(path.basename(att));
        } catch {}
      } else {
        storedAttachments.push(att);
      }
    }
    const withEmail = addCaseEmail(id, {
      to: mod?.address ?? "",
      subject: "Ownership information request",
      body: `Check number: ${checkNumber ?? ""}`,
      attachments: storedAttachments,
      sentAt: new Date().toISOString(),
      replyTo: null,
      snailMailStatus,
    });
    return NextResponse.json({ case: withEmail ?? updated, results });
  },
);
