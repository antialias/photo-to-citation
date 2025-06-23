import type { Case } from "@/lib/caseStore";
import { getCases } from "@/lib/caseStore";
import {
  getCaseOwnerContact,
  getCaseOwnerContactInfo,
  getCasePlateNumber,
  getCasePlateState,
  hasViolation,
} from "@/lib/caseUtils";
import { reportModules } from "@/lib/reportModules";

export const dynamic = "force-dynamic";

function computeSeverity(c: Case): number {
  const imgs = c.analysis?.images ? Object.values(c.analysis.images) : [];
  let max = 0;
  for (const info of imgs) {
    if (info.violation && info.representationScore > max) {
      max = info.representationScore;
    }
  }
  return max;
}

function nextAction(c: Case): string {
  if (c.analysisStatus === "pending") return "Awaiting image analysis.";
  if (c.analysisStatus === "failed" || !c.analysis)
    return "Re-run analysis with clearer photos.";
  if (!hasViolation(c.analysis)) return "No violation detected.";
  if (!getCasePlateNumber(c) && !getCasePlateState(c))
    return "Identify the license plate.";
  if (!getCaseOwnerContact(c)) return "Request ownership information.";
  const ownerInfo = getCaseOwnerContactInfo(c);
  if (
    ownerInfo?.email &&
    !(c.sentEmails ?? []).some((e) => e.to === ownerInfo.email)
  ) {
    return "Notify the registered owner.";
  }
  const authority = reportModules["oak-park"].authorityEmail;
  if (!(c.sentEmails ?? []).some((e) => e.to === authority)) {
    return "Notify the authorities.";
  }
  return "Await further updates.";
}

export default async function TriagePage() {
  const cases = getCases();
  const triage = cases
    .map((c) => ({ case: c, severity: computeSeverity(c) }))
    .filter((t) => t.severity > 0)
    .sort((a, b) => b.severity - a.severity)
    .slice(0, 5);
  return (
    <div className="p-8">
      <h1 className="text-xl font-bold mb-4">Case Triage</h1>
      {triage.length === 0 ? (
        <p>No open violations.</p>
      ) : (
        <ul className="grid gap-4">
          {triage.map(({ case: c, severity }) => (
            <li key={c.id} className="border p-4">
              <p className="font-semibold">Case {c.id}</p>
              {c.analysis?.violationType ? (
                <p>Violation: {c.analysis.violationType}</p>
              ) : null}
              <p>Severity: {(severity * 100).toFixed(0)}%</p>
              <p className="mt-2">{nextAction(c)}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
