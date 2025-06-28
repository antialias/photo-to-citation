import { authOptions } from "@/lib/authOptions";
import { getAuthorizedCase } from "@/lib/caseAccess";
import { draftEmail } from "@/lib/caseReport";
import { reportModules } from "@/lib/reportModules";
import { getServerSession } from "next-auth/next";
import { notFound } from "next/navigation";
import DraftEditor from "./DraftEditor";

export const dynamic = "force-dynamic";

export default async function DraftPage({
  params,
}: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = await getAuthorizedCase(id);
  if (!c) notFound();
  const reportModule = reportModules["oak-park"];
  const session = await getServerSession(authOptions);
  const sender = session?.user
    ? { name: session.user.name ?? null, email: session.user.email ?? null }
    : undefined;
  const email = await draftEmail(c, reportModule, sender);
  return (
    <DraftEditor
      caseId={id}
      initialDraft={email}
      attachments={c.photos}
      module={reportModule}
      action="report"
    />
  );
}
