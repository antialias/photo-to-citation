import { withAuthorization } from "@/lib/authz";
import { isCaseMember } from "@/lib/caseMembers";
import { draftFollowUp } from "@/lib/caseReport";
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
    const replyTo = current.replyTo;
    current = replyTo
      ? c.sentEmails?.find((m) => m.sentAt === replyTo)
      : undefined;
  }
  return chain;
}

export const GET = withAuthorization(
  "cases",
  "read",
  async (
    req: Request,
    {
      params,
      session,
    }: {
      params: Promise<{ id: string }>;
      session?: { user?: { id?: string; role?: string } };
    },
  ) => {
    const { id } = await params;
    const userId = session?.user?.id;
    const role = session?.user?.role ?? "user";
    if (
      role !== "admin" &&
      role !== "superadmin" &&
      (!userId || !isCaseMember(id, userId))
    ) {
      return new Response(null, { status: 403 });
    }
    const url = new URL(req.url);
    const replyTo = url.searchParams.get("replyTo");
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
    const email = await draftFollowUp(c, recipient, thread);
    console.log(`drafted email subject: ${email.subject}`);
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
  "cases",
  "read",
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
    console.log(
      `followup POST case=${id} to=${target} replyTo=${replyTo ?? "none"}`,
    );
    const results: Record<string, { success: boolean; error?: string }> = {};
    try {
      await sendEmail({ to: target, subject, body, attachments });
      results.email = { success: true };
    } catch (err) {
      console.error("Failed to send email", err);
      results.email = { success: false, error: (err as Error).message };
    }
    if (snailMail && reportModule.authorityAddress) {
      try {
        await sendSnailMail({
          address: reportModule.authorityAddress,
          subject,
          body,
          attachments,
        });
        results.snailMail = { success: true };
      } catch (err) {
        console.error("Failed to send snail mail", err);
        results.snailMail = { success: false, error: (err as Error).message };
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
        }) ?? c;
    }
    return NextResponse.json({ case: updated, results });
  },
);
