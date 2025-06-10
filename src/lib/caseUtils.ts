import type { Case } from "./caseStore";

export function getRepresentativePhoto(caseData: Pick<Case, "photos">): string {
  return [...caseData.photos].sort()[0];
}
