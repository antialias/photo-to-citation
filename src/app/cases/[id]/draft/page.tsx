import { getAuthorizedCase } from "@/lib/caseAccess";
import { draftEmail } from "@/lib/caseReport";
import { reportModules } from "@/lib/reportModules";
import { notFound } from "next/navigation";
import { LanguageContext, SessionContext } from "../../../server-context";
import DraftEditor from "./DraftEditor";

export const dynamic = "force-dynamic";

export default async function DraftPage({
  params,
}: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = await getAuthorizedCase(id);
  if (!c) notFound();
  const reportModule = reportModules["oak-park"];
  const session = SessionContext.read();
  const sender = session?.user
    ? { name: session.user.name ?? null, email: session.user.email ?? null }
    : undefined;
  const lang = LanguageContext.read();
  const email = await draftEmail(c, reportModule, sender, lang);
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
