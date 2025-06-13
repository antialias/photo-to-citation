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
  const authorities = [reportModules["oak-park"].authorityName];
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
  const notifications: Array<Promise<void>> = [];
  if (methods.includes("email") && contactInfo.email) {
    notifications.push(
      sendEmail({
        to: contactInfo.email,
        subject,
        body,
        attachments,
      }),
    );
  }
  if (methods.includes("sms") && contactInfo.phone) {
    notifications.push(sendSms(contactInfo.phone, body));
  }
  if (methods.includes("whatsapp") && contactInfo.phone) {
    notifications.push(sendWhatsapp(contactInfo.phone, body));
  }
  if (methods.includes("robocall") && contactInfo.phone) {
    notifications.push(makeRobocall(contactInfo.phone, body));
  }
  if (methods.includes("snailMail") && contactInfo.address) {
    notifications.push(
      sendSnailMail({
        address: contactInfo.address,
        subject,
        body,
        attachments,
      }),
    );
  }
  if (methods.includes("snailMailLocation") && c.streetAddress) {
    notifications.push(
      sendSnailMail({
        address: c.streetAddress,
        subject,
        body,
        attachments,
      }),
    );
  }
  try {
    await Promise.all(notifications);
  } catch (err) {
    console.error("Failed to send notification", err);
    return NextResponse.json(
      { error: "Failed to send notification" },
      { status: 500 },
    );
  }
  if (methods.includes("email") && contactInfo.email) {
    const updated = addCaseEmail(id, {
      to: contactInfo.email,
      subject,
      body,
      attachments,
      sentAt: new Date().toISOString(),
      replyTo: null,
    });
    return NextResponse.json(updated);
  }
  return NextResponse.json({ success: true });
}
