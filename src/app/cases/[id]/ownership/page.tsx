import { initI18n } from "@/i18n.server";
import { getAuthorizedCase } from "@/lib/caseAccess";
import { ownershipModules } from "@/lib/ownershipModules";
import type { OwnershipModule } from "@/lib/ownershipModules";
import { notFound } from "next/navigation";
import OwnershipEditor from "./OwnershipEditor";

export const dynamic = "force-dynamic";

export default async function OwnershipPage({
  params,
}: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { t } = await initI18n("en");
  const c = await getAuthorizedCase(id);
  if (!c) notFound();
  const state = c.analysis?.vehicle?.licensePlateState?.toLowerCase();
  const mod = state ? ownershipModules[state] : undefined;
  if (!mod) {
    const supported = Object.keys(ownershipModules)
      .map((s) => s.toUpperCase())
      .join(", ");
    const label = state ? state.toUpperCase() : "unknown";
    return (
      <div className="p-8">{t("noOwnershipModule", { label, supported })}</div>
    );
  }
  const { requestVin: _rv, requestContactInfo: rc, ...clientMod } = mod;
  return (
    <OwnershipEditor
      caseId={id}
      module={
        clientMod as Omit<OwnershipModule, "requestVin" | "requestContactInfo">
      }
      showPdf={Boolean(rc)}
    />
  );
}
