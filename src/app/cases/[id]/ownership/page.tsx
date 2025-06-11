import { getCase } from "@/lib/caseStore";
import { ownershipModules } from "@/lib/ownershipModules";
import OwnershipEditor from "./OwnershipEditor";

export const dynamic = "force-dynamic";

export default async function OwnershipPage({
  params,
}: { params: { id: string } }) {
  const { id } = await params;
  const c = getCase(id);
  if (!c) return <div className="p-8">Case not found</div>;
  const state = c.analysis?.vehicle?.licensePlateState?.toLowerCase();
  const mod = state ? ownershipModules[state] : undefined;
  if (!mod) return <div className="p-8">No module for this state</div>;
  return <OwnershipEditor caseId={id} module={mod} />;
}
