import { withAuthorization } from "@/lib/authz";
import { isCaseMember } from "@/lib/caseMembers";
import { draftEmail } from "@/lib/caseReport";
import { addCaseEmail, getCase } from "@/lib/caseStore";
import { sendSnailMail } from "@/lib/contactMethods";
import { sendEmail } from "@/lib/email";
import { reportModules } from "@/lib/reportModules";
import { NextResponse } from "next/server";

export const GET = withAuthorization(
  "cases",
  "read",
  async (
    _req: Request,
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
    const c = getCase(id);
    if (!c) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const reportModule = reportModules["oak-park"];
    const email = await draftEmail(c, reportModule);
    return NextResponse.json({
      email,
      attachments: c.photos,
      module: reportModule,
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
    const results: Record<string, { success: boolean; error?: string }> = {};
    try {
      await sendEmail({ to, subject, body, attachments });
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
          to,
          subject,
          body,
          attachments,
          sentAt: new Date().toISOString(),
          replyTo: null,
        }) ?? c;
    }
    return NextResponse.json({ case: updated, results });
  },
);
