export interface CaseAction {
  id: string;
  label: string;
  href: (caseId: string) => string;
  description: string;
}

export const caseActions: CaseAction[] = [
  {
    id: "compose",
    label: "Draft Report",
    href: (id) => `/cases/${id}/compose`,
    description:
      "Open a modal to draft an email report to the relevant authority. Use when the user wants to formally report the violation.",
  },
  {
    id: "followup",
    label: "Follow Up",
    href: (id) => `/cases/${id}/followup`,
    description:
      "Send a follow-up email referencing previous correspondence. Suggest this when the user needs to check the status of a prior report.",
  },
  {
    id: "notify-owner",
    label: "Notify Owner",
    href: (id) => `/cases/${id}/notify-owner`,
    description:
      "Send an anonymous notice to the vehicle owner about the violation. Useful when the owner might not know they were reported.",
  },
  {
    id: "ownership",
    label: "Request Ownership Info",
    href: (id) => `/cases/${id}/ownership`,
    description:
      "Record the steps for requesting official ownership details from the state. Use if the license plate is known but contact info is missing.",
  },
  {
    id: "upload-photo",
    label: "Upload Photo",
    href: (id) => `/point?case=${id}`,
    description:
      "Open the photo upload interface to add an existing image to the case.",
  },
  {
    id: "take-photo",
    label: "Take Photo",
    href: (id) => `/point?case=${id}`,
    description: "Use the device camera to capture a new photo for the case.",
  },
];
