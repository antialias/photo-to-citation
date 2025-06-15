import { getCase } from "@/lib/caseStore";
import { ownershipModules } from "@/lib/ownershipModules";
import OwnershipEditor from "./OwnershipEditor";

export const dynamic = "force-dynamic";

export default async function OwnershipPage({
  params,
}: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = getCase(id);
  if (!c) return <div className="p-8">Case not found</div>;
  const state = c.analysis?.vehicle?.licensePlateState?.toLowerCase();
  const mod = state ? ownershipModules[state] : undefined;
  if (!mod) {
    const supported = Object.keys(ownershipModules)
      .map((s) => s.toUpperCase())
      .join(", ");
    const label = state ? state.toUpperCase() : "unknown";
    return (
      <div className="p-8">
        No ownership module for state <strong>{label}</strong>. Supported
        states: {supported}. Please ensure the license plate state uses a
        two-letter abbreviation.
      </div>
    );
  }
  return <OwnershipEditor caseId={id} module={mod} />;
}
