export const dynamic = "force-dynamic";

import { withAuthorization } from "@/lib/authz";
import { getCases } from "@/lib/caseStore";
import { NextResponse } from "next/server";

export const GET = withAuthorization({ obj: "cases" }, async (req: Request) => {
  const url = new URL(req.url);
  const statuses = url.searchParams.getAll("status");
  const openParam = url.searchParams.get("open");
  const caseId = url.searchParams.get("case");
  const openOnly = openParam !== "false" && openParam !== "0";
  const cases = getCases().filter((c) => {
    if (caseId && c.id !== caseId) return false;
    if (!caseId && openOnly && (c.closed || c.archived)) return false;
    return true;
  });
  const mails: Array<{
    caseId: string;
    subject: string;
    status: NonNullable<import("@/lib/caseStore").SentEmail["snailMailStatus"]>;
    sentAt: string;
  }> = [];
  for (const c of cases) {
    for (const mail of c.sentEmails ?? []) {
      if (!mail.snailMailStatus) continue;
      if (statuses.length > 0 && !statuses.includes(mail.snailMailStatus)) {
        continue;
      }
      mails.push({
        caseId: c.id,
        subject: mail.subject,
        status: mail.snailMailStatus,
        sentAt: mail.sentAt,
      });
    }
  }
  mails.sort(
    (a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime(),
  );
  return NextResponse.json(mails);
});
