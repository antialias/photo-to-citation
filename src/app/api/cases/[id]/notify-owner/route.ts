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

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
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
  const email = await draftOwnerNotification(c, authorities);
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
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
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
  async function run(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      results[name] = { success: true };
    } catch (err) {
      console.error(`Failed to send ${name}`, err);
      results[name] = { success: false, error: (err as Error).message };
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
  if (methods.includes("snailMail") && contactInfo.address) {
    const address = contactInfo.address;
    await run("snailMail", () =>
      sendSnailMail({
        address,
        subject,
        body,
        attachments,
      }),
    );
  }
  if (methods.includes("snailMailLocation") && c.streetAddress) {
    const address = c.streetAddress;
    await run("snailMailLocation", () =>
      sendSnailMail({
        address,
        subject,
        body,
        attachments,
      }),
    );
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
      }) ?? c;
  }
  return NextResponse.json({ case: updated, results });
}
