import { withAuthorization, withCaseAuthorization } from "@/lib/authz";
import { draftFollowUp } from "@/lib/caseReport";
import type { Case, SentEmail } from "@/lib/caseStore";
import { addCaseEmail, getCase } from "@/lib/caseStore";
import { sendSnailMail } from "@/lib/contactMethods";
import { sendEmail } from "@/lib/email";
import { log } from "@/lib/logger";
import { reportModules } from "@/lib/reportModules";
import type { SnailMailStatus } from "@/lib/snailMail";
import { NextResponse } from "next/server";

function getThread(c: Case, startId?: string | null): SentEmail[] {
  let current = startId
    ? c.sentEmails?.find((m) => m.sentAt === startId)
    : c.sentEmails?.at(-1);
  const chain: SentEmail[] = [];
  while (current) {
    chain.unshift(current);
    const replyTo = current.replyTo;
    current = replyTo
      ? c.sentEmails?.find((m) => m.sentAt === replyTo)
      : undefined;
  }
  return chain;
}

export const GET = withCaseAuthorization(
  { obj: "cases" },
  async (
    req: Request,
    {
      params,
      session,
    }: {
      params: Promise<{ id: string }>;
      session?: {
        user?: { id?: string; role?: string; name?: string; email?: string };
      };
    },
  ) => {
    const { id } = await params;
    const url = new URL(req.url);
    const replyTo = url.searchParams.get("replyTo");
    const lang = url.searchParams.get("lang") ?? "en";
    log(`followup GET case=${id} replyTo=${replyTo ?? "none"}`);
    const c = getCase(id);
    if (!c) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const reportModule = reportModules["oak-park"];
    const thread = getThread(c, replyTo);
    log(
      `thread chain: ${thread
        .map((m) => `${m.sentAt}->${m.replyTo ?? "null"}`)
        .join(", ")}`,
    );
    const recipient = thread.at(-1)?.to || reportModule.authorityName;
    log(`drafting followup for ${recipient} with ${thread.length} emails`);
    const sender = session?.user
      ? { name: session.user.name ?? null, email: session.user.email ?? null }
      : undefined;
    const email = await draftFollowUp(c, recipient, thread, sender, lang);
    log(`drafted email subject: ${email.subject}`);
    return NextResponse.json({
      email,
      attachments: c.photos,
      module: reportModule,
      to: recipient,
      replyTo,
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
    log(`followup POST case=${id} to=${target} replyTo=${replyTo ?? "none"}`);
    const results: Record<string, { success: boolean; error?: string }> = {};
    let snailMailStatus: SentEmail["snailMailStatus"];
    try {
      await sendEmail({ to: target, subject, body, attachments });
      results.email = { success: true };
    } catch (err) {
      console.error("Failed to send email", err);
      results.email = { success: false, error: (err as Error).message };
    }
    if (snailMail && reportModule.authorityAddress) {
      try {
        const res = await sendSnailMail({
          address: reportModule.authorityAddress,
          subject,
          body,
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
    let updated = c;
    if (results.email?.success) {
      updated =
        addCaseEmail(id, {
          to: target,
          subject,
          body,
          attachments,
          sentAt: new Date().toISOString(),
          replyTo: replyTo ?? null,
          snailMailStatus,
        }) ?? c;
    }
    return NextResponse.json({ case: updated, results });
  },
);
