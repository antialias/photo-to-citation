import type { Case } from "@/lib/caseStore";
import {
  getCaseOwnerContact,
  getCasePlateNumber,
  getCasePlateState,
  getCaseVin,
  hasViolation,
} from "@/lib/caseUtils";
import MultiCaseToolbar from "./MultiCaseToolbar";

export default function CaseSummary({ cases }: { cases: Case[] }) {
  if (cases.length === 0) return null;
  const first = cases[0];
  function allEqual<T>(getter: (c: Case) => T): T | undefined {
    const value = getter(first);
    return cases.every((c) => getter(c) === value) ? value : undefined;
  }
  const violation = allEqual((c) =>
    hasViolation(c.analysis) ? c.analysis?.violationType : undefined,
  );
  const plateNum = allEqual((c) => getCasePlateNumber(c));
  const plateState = allEqual((c) => getCasePlateState(c));
  const vin = allEqual((c) => getCaseVin(c));
  const contact = allEqual((c) => getCaseOwnerContact(c));

  const actionsDisabled = !cases.every(
    (c) => c.analysisStatus === "complete" && hasViolation(c.analysis),
  );
  const hasOwnerAll = cases.every((c) => Boolean(getCaseOwnerContact(c)));
  const ids = cases.map((c) => c.id);

  return (
    <div className="flex flex-col">
      <MultiCaseToolbar
        caseIds={ids}
        disabled={actionsDisabled}
        hasOwner={hasOwnerAll}
      />
      <div className="p-8 flex flex-col gap-2">
        <h1 className="text-xl font-semibold">Case Summary</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {cases.length} cases selected.
        </p>
        {violation ? <p>Violation: {violation}</p> : null}
        {plateNum || plateState ? (
          <p>
            Plate: {plateState ? `${plateState} ` : ""}
            {plateNum}
          </p>
        ) : null}
        {vin ? <p>VIN: {vin}</p> : null}
        {contact ? <p>Owner Contact: {contact}</p> : null}
      </div>
    </div>
  );
}
