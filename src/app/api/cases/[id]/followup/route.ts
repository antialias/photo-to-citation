import { draftFollowUp } from "@/lib/caseReport";
import { addCaseEmail, getCase } from "@/lib/caseStore";
import { sendEmail } from "@/lib/email";
import { reportModules } from "@/lib/reportModules";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const url = new URL(req.url);
  const replyTo = url.searchParams.get("replyTo");
  const c = getCase(id);
  if (!c) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const reportModule = reportModules["oak-park"];
  const recipient =
    c.sentEmails?.find((e) => e.sentAt === replyTo)?.to ||
    reportModule.authorityName;
  const email = await draftFollowUp(c, recipient);
  return NextResponse.json({
    email,
    attachments: c.photos,
    module: reportModule,
    to: recipient,
    replyTo,
  });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { subject, body, attachments, replyTo } = (await req.json()) as {
    subject: string;
    body: string;
    attachments: string[];
    replyTo?: string | null;
  };
  const c = getCase(id);
  if (!c) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const reportModule = reportModules["oak-park"];
  const target =
    c.sentEmails?.find((e) => e.sentAt === replyTo)?.to ||
    reportModule.authorityEmail;
  try {
    await sendEmail({
      to: target,
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
    to: target,
    subject,
    body,
    attachments,
    sentAt: new Date().toISOString(),
    replyTo: replyTo ?? null,
  });
  return NextResponse.json(updated);
}
