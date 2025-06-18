export interface LandingStats {
  casesLastWeek: number;
  authorityNotifications: number;
  avgDaysToNotification: number;
  notificationSuccessRate: number;
}

import { getCases } from "./caseStore";
import { reportModules } from "./reportModules";
import { getSentMails } from "./snailMailStore";

function addressKey(address: {
  address1: string;
  address2?: string | null;
  city: string;
  state: string;
  postalCode: string;
}): string {
  return [
    address.address1.trim(),
    address.address2?.trim() || "",
    address.city.trim(),
    address.state.trim(),
    address.postalCode.trim(),
  ]
    .join("|")
    .toLowerCase();
}

function parseAuthorityAddress(text?: string | null) {
  if (!text) return null;
  const [first, second] = text.split("\n");
  if (!first || !second) return null;
  const [cityPart, stateZip] = second.split(",");
  if (!stateZip) return null;
  const [state, postalCode] = stateZip.trim().split(/\s+/);
  return {
    address1: first.trim(),
    city: cityPart.trim(),
    state: state.trim(),
    postalCode: postalCode.trim(),
  };
}

export function getLandingStats(): LandingStats {
  const cases = getCases();
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const module = reportModules["oak-park"];
  const authorityEmail = module.authorityEmail;
  const authorityAddress = parseAuthorityAddress(module.authorityAddress);

  let casesLastWeek = 0;
  let authorityNotifications = 0;
  let delayTotal = 0;
  let casesWithNotification = 0;

  for (const c of cases) {
    const created = new Date(c.createdAt).getTime();
    if (created >= weekAgo) casesLastWeek++;
    const emails = (c.sentEmails || []).filter((m) => m.to === authorityEmail);
    if (emails.length > 0) {
      authorityNotifications += emails.length;
      delayTotal += new Date(emails[0].sentAt).getTime() - created;
      casesWithNotification++;
    }
  }

  if (authorityAddress) {
    const key = addressKey(authorityAddress);
    const snailMails = getSentMails().filter((m) => addressKey(m.to) === key);
    authorityNotifications += snailMails.length;
  }

  const avgDays =
    casesWithNotification > 0
      ? delayTotal / casesWithNotification / (1000 * 60 * 60 * 24)
      : 0;
  const success = cases.length > 0 ? casesWithNotification / cases.length : 0;

  return {
    casesLastWeek,
    authorityNotifications,
    avgDaysToNotification: avgDays,
    notificationSuccessRate: success,
  };
}
