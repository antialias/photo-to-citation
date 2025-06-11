import { draftEmail } from "@/lib/caseReport";
import { getCase } from "@/lib/caseStore";
import { reportModules } from "@/lib/reportModules";
import DraftEditor from "./DraftEditor";

export const dynamic = "force-dynamic";

export default async function DraftPage({
  params,
}: { params: { id: string } }) {
  const { id } = await params;
  const c = getCase(id);
  if (!c) return <div className="p-8">Case not found</div>;
  const module = reportModules["oak-park"];
  const email = await draftEmail(c, module);
  return (
    <DraftEditor
      caseId={id}
      initialDraft={email}
      attachments={c.photos}
      module={module}
    />
  );
}
