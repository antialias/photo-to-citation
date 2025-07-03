import { withAuthorization, withCaseAuthorization } from "@/lib/authz";
import { draftEmail } from "@/lib/caseReport";
import { addCaseEmail, getCase } from "@/lib/caseStore";
import type { SentEmail } from "@/lib/caseStore";
import { sendSnailMail } from "@/lib/contactMethods";
import { sendEmail } from "@/lib/email";
import { reportModules } from "@/lib/reportModules";
import { NextResponse } from "next/server";

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
        user?: { id?: string; role?: string; email?: string; name?: string };
      };
    },
  ) => {
    const { id } = await params;
    const url = new URL(req.url);
    const lang = url.searchParams.get("lang") ?? "en";
    const c = getCase(id);
    if (!c) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const reportModule = reportModules["oak-park"];
    const sender = session?.user
      ? { name: session.user.name ?? null, email: session.user.email ?? null }
      : undefined;
    const email = await draftEmail(c, reportModule, sender, lang);
    return NextResponse.json({
      email,
      attachments: c.photos,
      module: reportModule,
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
    let snailStatus: SentEmail["snailMailStatus"] | undefined;
    try {
      await sendEmail({ to, subject, body, attachments });
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
        snailStatus = res.status as SentEmail["snailMailStatus"];
        results.snailMail = {
          success: res.status === "queued" || res.status === "saved",
          ...(res.status !== "queued" && res.status !== "saved"
            ? { error: res.status }
            : {}),
        };
      } catch (err) {
        console.error("Failed to send snail mail", err);
        results.snailMail = { success: false, error: (err as Error).message };
        snailStatus = "error";
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
          ...(snailStatus ? { snailMailStatus: snailStatus } : {}),
        }) ?? c;
    }
    return NextResponse.json({ case: updated, results });
  },
);
