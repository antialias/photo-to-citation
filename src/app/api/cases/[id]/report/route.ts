import { draftEmail } from "@/lib/caseReport";
import { addCaseEmail, getCase } from "@/lib/caseStore";
import { sendEmail } from "@/lib/email";
import { reportModules } from "@/lib/reportModules";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const { id } = await params;
  const c = getCase(id);
  if (!c) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const module = reportModules["oak-park"];
  const email = await draftEmail(c, module);
  return NextResponse.json({ email, attachments: c.photos, module });
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  const { id } = params;
  const { subject, body, attachments } = (await req.json()) as {
    subject: string;
    body: string;
    attachments: string[];
  };
  const c = getCase(id);
  if (!c) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const module = reportModules["oak-park"];
  try {
    await sendEmail({
      to: module.authorityEmail,
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
