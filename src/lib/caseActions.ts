import {
  getCaseOwnerContact,
  getCaseOwnerContactInfo,
  getCasePlateNumber,
  getCasePlateState,
  hasViolation,
} from "./caseUtils";
import { reportModules } from "./reportModules";

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
    href: (id) => `/upload?case=${id}`,
    description: "Upload an existing photo to this case.",
  },
  {
    id: "take-photo",
    label: "Take Photo",
    href: (id) => `/point?case=${id}`,
    description: "Use your camera to take a new photo for this case.",
  },
];

export interface CaseActionStatus extends CaseAction {
  applicable: boolean;
  reason?: string;
}

export function getCaseActionStatus(
  c: import("./caseStore").Case,
): CaseActionStatus[] {
  const ownerEmail = getCaseOwnerContactInfo(c)?.email;
  const authority = reportModules["oak-park"].authorityEmail;
  return caseActions.map((a) => {
    let applicable = true;
    let reason: string | undefined;
    switch (a.id) {
      case "compose":
        if (c.analysisStatus !== "complete" || !hasViolation(c.analysis)) {
          applicable = false;
          reason = "analysis incomplete or no violation";
        } else if ((c.sentEmails ?? []).some((e) => e.to === authority)) {
          applicable = false;
          reason = "already reported";
        }
        break;
      case "followup":
        if (!(c.sentEmails ?? []).some((e) => e.to === authority)) {
          applicable = false;
          reason = "no prior report";
        } else if (
          (c.sentEmails ?? []).some((e) => e.to === authority && e.replyTo)
        ) {
          applicable = false;
          reason = "follow-up already sent";
        }
        break;
      case "notify-owner":
        if (!ownerEmail) {
          applicable = false;
          reason = "no owner contact info";
        } else if ((c.sentEmails ?? []).some((e) => e.to === ownerEmail)) {
          applicable = false;
          reason = "owner already notified";
        }
        break;
      case "ownership":
        if (getCaseOwnerContact(c)) {
          applicable = false;
          reason = "owner contact already known";
        } else if (!getCasePlateNumber(c) && !getCasePlateState(c)) {
          applicable = false;
          reason = "missing license plate info";
        } else if ((c.ownershipRequests ?? []).length > 0) {
          applicable = false;
          reason = "ownership info already requested";
        }
        break;
      default:
        break;
    }
    return { ...a, applicable, reason };
  });
}
