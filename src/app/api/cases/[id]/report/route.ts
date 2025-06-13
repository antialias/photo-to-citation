import { draftEmail } from "@/lib/caseReport";
import { addCaseEmail, getCase } from "@/lib/caseStore";
import { sendSnailMail } from "@/lib/contactMethods";
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
  const reportModule = reportModules["oak-park"];
  const email = await draftEmail(c, reportModule);
  return NextResponse.json({
    email,
    attachments: c.photos,
    module: reportModule,
  });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { subject, body, attachments, snailMail } = (await req.json()) as {
    subject: string;
    body: string;
    attachments: string[];
    snailMail?: boolean;
  };
  const c = getCase(id);
  if (!c) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const reportModule = reportModules["oak-park"];
  const to = reportModule.authorityEmail;
  try {
    await sendEmail({
      to,
      subject,
      body,
      attachments,
    });
    if (snailMail && reportModule.authorityAddress) {
      await sendSnailMail({
        address: reportModule.authorityAddress,
        subject,
        body,
        attachments,
      });
    }
  } catch (err) {
    console.error("Failed to send email", err);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 },
    );
  }
  const updated = addCaseEmail(id, {
    to,
    subject,
    body,
    attachments,
    sentAt: new Date().toISOString(),
    replyTo: null,
  });
  return NextResponse.json(updated);
}
