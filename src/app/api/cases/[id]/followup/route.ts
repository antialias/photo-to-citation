import { draftFollowUp, draftFollowUpWithOwnerInfo } from "@/lib/caseReport";
import type { Case, SentEmail } from "@/lib/caseStore";
import { addCaseEmail, getCase } from "@/lib/caseStore";
import { sendSnailMail } from "@/lib/contactMethods";
import { sendEmail } from "@/lib/email";
import { reportModules } from "@/lib/reportModules";
import { NextResponse } from "next/server";

function getThread(c: Case, startId?: string | null): SentEmail[] {
  let current = startId
    ? c.sentEmails?.find((m) => m.sentAt === startId)
    : c.sentEmails?.at(-1);
  const chain: SentEmail[] = [];
  while (current) {
    chain.unshift(current);
    current = current.replyTo
      ? c.sentEmails?.find((m) => m.sentAt === current.replyTo)
      : undefined;
  }
  return chain;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const url = new URL(req.url);
  const replyTo = url.searchParams.get("replyTo");
  const owner = url.searchParams.get("owner");
  console.log(`followup GET case=${id} replyTo=${replyTo ?? "none"}`);
  const c = getCase(id);
  if (!c) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const reportModule = reportModules["oak-park"];
  const thread = getThread(c, replyTo);
  console.log(
    `thread chain: ${thread
      .map((m) => `${m.sentAt}->${m.replyTo ?? "null"}`)
      .join(", ")}`,
  );
  const recipient = thread.at(-1)?.to || reportModule.authorityName;
  console.log(
    `drafting followup for ${recipient} with ${thread.length} emails`,
  );
  const email = owner
    ? await draftFollowUpWithOwnerInfo(c, recipient, thread)
    : await draftFollowUp(c, recipient, thread);
  console.log(`drafted email subject: ${email.subject}`);
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
  const { subject, body, attachments, replyTo, snailMail } =
    (await req.json()) as {
      subject: string;
      body: string;
      attachments: string[];
      replyTo?: string | null;
      snailMail?: boolean;
    };
  const c = getCase(id);
  if (!c) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const reportModule = reportModules["oak-park"];
  const target =
    c.sentEmails?.find((e) => e.sentAt === replyTo)?.to ||
    reportModule.authorityEmail;
  console.log(
    `followup POST case=${id} to=${target} replyTo=${replyTo ?? "none"}`,
  );
  try {
    await sendEmail({
      to: target,
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
    to: target,
    subject,
    body,
    attachments,
    sentAt: new Date().toISOString(),
    replyTo: replyTo ?? null,
  });
  return NextResponse.json(updated);
}
