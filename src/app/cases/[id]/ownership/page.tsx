import fs from "node:fs";
import { initI18n } from "@/i18n.server";
import { getAuthorizedCase } from "@/lib/caseAccess";
import {
  getCasePlateNumber,
  getCasePlateState,
  getCaseVin,
} from "@/lib/caseUtils";
import {
  type OwnershipModule,
  type OwnershipRequestInfo,
  fillIlForm,
  ownershipModules,
} from "@/lib/ownershipModules";
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
  const { requestVin: _rv, requestContactInfo: _rc, ...clientMod } = mod;
  let pdfData: string | undefined;
  if (mod.requestContactInfo) {
    const info: OwnershipRequestInfo = {
      plate: getCasePlateNumber(c) ?? "",
      state: getCasePlateState(c) ?? "",
      vin: getCaseVin(c) ?? undefined,
    };
    const pdfPath = await fillIlForm(info);
    const bytes = fs.readFileSync(pdfPath);
    pdfData = Buffer.from(bytes).toString("base64");
  }
  return (
    <OwnershipEditor
      caseId={id}
      module={
        clientMod as Omit<OwnershipModule, "requestVin" | "requestContactInfo">
      }
      pdfData={pdfData}
    />
  );
}
