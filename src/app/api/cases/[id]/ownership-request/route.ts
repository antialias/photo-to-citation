import fs from "node:fs";
import path from "node:path";

import { NextResponse } from "next/server";

import { withCaseAuthorization } from "@/lib/authz";
import { addCaseEmail, addOwnershipRequest, getCase } from "@/lib/caseStore";
import { config } from "@/lib/config";
import { sendSnailMail } from "@/lib/contactMethods";
import { ownershipModules } from "@/lib/ownershipModules";

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
    const mod = ownershipModules[moduleId];
    let attachments: string[] = [];
    if (mod?.generateForms) {
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
    if (snailMail && mod?.address) {
      await sendSnailMail({
        address: mod.address,
        subject: "Ownership information request",
        body: `Check number: ${checkNumber ?? ""}`,
        attachments,
      });
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
    });
    return NextResponse.json({ case: withEmail ?? updated });
  },
);
