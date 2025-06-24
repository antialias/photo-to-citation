import UploadWrapper from "@/app/cases/[id]/UploadWrapper";
import { getCase } from "@/lib/caseStore";

export const dynamic = "force-dynamic";

export default async function UploadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const c = getCase(id);
  return <UploadWrapper caseData={c ?? null} caseId={id} />;
}
