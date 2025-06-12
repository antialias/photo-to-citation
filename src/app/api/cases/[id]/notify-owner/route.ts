import { draftOwnerNotification } from "@/lib/caseReport";
import { addCaseEmail, getCase } from "@/lib/caseStore";
import { getCaseOwnerContact } from "@/lib/caseUtils";
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
  const contact = getCaseOwnerContact(c);
  if (!contact) {
    return NextResponse.json({ error: "No owner contact" }, { status: 400 });
  }
  const authorities = [reportModules["oak-park"].authorityName];
  const email = await draftOwnerNotification(c, authorities);
  return NextResponse.json({
    email,
    attachments: c.photos,
    contact,
  });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { subject, body, attachments } = (await req.json()) as {
    subject: string;
    body: string;
    attachments: string[];
  };
  const c = getCase(id);
  if (!c) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const contact = getCaseOwnerContact(c);
  if (!contact) {
    return NextResponse.json({ error: "No owner contact" }, { status: 400 });
  }
  try {
    await sendEmail({
      to: contact,
      subject,
      body,
      attachments,
    });
  } catch (err) {
    console.error("Failed to send email", err);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 },
    );
  }
  const updated = addCaseEmail(id, {
    subject,
    body,
    attachments,
    sentAt: new Date().toISOString(),
  });
  return NextResponse.json(updated);
}
