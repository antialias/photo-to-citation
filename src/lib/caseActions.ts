export interface CaseAction {
  id: string;
  label: string;
  href: (caseId: string) => string;
}

export const caseActions: CaseAction[] = [
  {
    id: "compose",
    label: "Draft Report",
    href: (id) => `/cases/${id}/compose`,
  },
  {
    id: "followup",
    label: "Follow Up",
    href: (id) => `/cases/${id}/followup`,
  },
  {
    id: "notify-owner",
    label: "Notify Owner",
    href: (id) => `/cases/${id}/notify-owner`,
  },
  {
    id: "ownership",
    label: "Request Ownership Info",
    href: (id) => `/cases/${id}/ownership`,
  },
];
