import { withAuthorization, withCaseAuthorization } from "@/lib/authz";
import { draftOwnerNotification } from "@/lib/caseReport";
import { addCaseEmail, getCase } from "@/lib/caseStore";
import { getCaseOwnerContactInfo } from "@/lib/caseUtils";
import {
  makeRobocall,
  sendSms,
  sendSnailMail,
  sendWhatsapp,
} from "@/lib/contactMethods";
import { sendEmail } from "@/lib/email";
import { reportModules } from "@/lib/reportModules";
import { NextResponse } from "next/server";

export const GET = withCaseAuthorization(
  { obj: "cases" },
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
    const url = new URL(req.url);
    const lang = url.searchParams.get("lang") ?? "en";
    const c = getCase(id);
    if (!c) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const contactInfo = getCaseOwnerContactInfo(c);
    if (!contactInfo) {
      return NextResponse.json({ error: "No owner contact" }, { status: 400 });
    }
    const reportModule = reportModules["oak-park"];
    const authorities = c.sentEmails?.some(
      (m) => m.to === reportModule.authorityEmail,
    )
      ? [reportModule.authorityName]
      : [];
    const email = await draftOwnerNotification(c, authorities, lang);
    return NextResponse.json({
      email,
      attachments: c.photos,
      contactInfo,
      violationAddress: c.streetAddress,
      availableMethods: [
        contactInfo.email ? "email" : null,
        contactInfo.phone ? "sms" : null,
        contactInfo.phone ? "whatsapp" : null,
        contactInfo.phone ? "robocall" : null,
        contactInfo.address ? "snailMail" : null,
        c.streetAddress ? "snailMailLocation" : null,
      ].filter(Boolean),
    });
  },
);

export const POST = withAuthorization(
  { obj: "cases", act: "read" },
  async (
    req: Request,
    {
      params,
    }: {
      params: Promise<{ id: string }>;
      session?: { user?: { role?: string } };
    },
  ) => {
    const { id } = await params;
    const { subject, body, attachments, methods } = (await req.json()) as {
      subject: string;
      body: string;
      attachments: string[];
      methods: string[];
    };
    const c = getCase(id);
    if (!c) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const contactInfo = getCaseOwnerContactInfo(c);
    if (!contactInfo) {
      return NextResponse.json({ error: "No owner contact" }, { status: 400 });
    }
    const results: Record<string, { success: boolean; error?: string }> = {};
    async function run<T>(
      name: string,
      fn: () => Promise<T>,
    ): Promise<T | undefined> {
      try {
        const val = await fn();
        results[name] = { success: true };
        return val;
      } catch (err) {
        console.error(`Failed to send ${name}`, err);
        results[name] = { success: false, error: (err as Error).message };
        return undefined;
      }
    }
    if (methods.includes("email") && contactInfo.email) {
      const toEmail = contactInfo.email;
      await run("email", () =>
        sendEmail({
          to: toEmail,
          subject,
          body,
          attachments,
        }),
      );
    }
    if (methods.includes("sms") && contactInfo.phone) {
      const phone = contactInfo.phone;
      await run("sms", () => sendSms(phone, body));
    }
    if (methods.includes("whatsapp") && contactInfo.phone) {
      const phone = contactInfo.phone;
      await run("whatsapp", () => sendWhatsapp(phone, body));
    }
    if (methods.includes("robocall") && contactInfo.phone) {
      const phone = contactInfo.phone;
      await run("robocall", () => makeRobocall(phone, body));
    }
    let snailStatus: string | undefined;
    if (methods.includes("snailMail") && contactInfo.address) {
      const address = contactInfo.address;
      const res = await run("snailMail", () =>
        sendSnailMail({
          address,
          subject,
          body,
          attachments,
        }),
      );
      snailStatus = res?.status ?? snailStatus;
    }
    if (methods.includes("snailMailLocation") && c.streetAddress) {
      const address = c.streetAddress;
      const res = await run("snailMailLocation", () =>
        sendSnailMail({
          address,
          subject,
          body,
          attachments,
        }),
      );
      snailStatus = res?.status ?? snailStatus;
    }
    let updated = c;
    if (
      methods.includes("email") &&
      contactInfo.email &&
      results.email?.success
    ) {
      const toEmail = contactInfo.email;
      updated =
        addCaseEmail(id, {
          to: toEmail,
          subject,
          body,
          attachments,
          sentAt: new Date().toISOString(),
          replyTo: null,
          ...(snailStatus ? { snailMailStatus: snailStatus } : {}),
        }) ?? c;
    }
    return NextResponse.json({ case: updated, results });
  },
);
