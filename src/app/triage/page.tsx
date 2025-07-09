import { authOptions } from "@/lib/authOptions";
import type { Case } from "@/lib/caseStore";
import { getCases } from "@/lib/caseStore";
import {
  getCaseOwnerContact,
  getCaseOwnerContactInfo,
  getCasePlateNumber,
  getCasePlateState,
  hasCaseViolation,
} from "@/lib/caseUtils";
import { reportModules } from "@/lib/reportModules";
import { getServerSession } from "next-auth/next";
import { cookies, headers } from "next/headers";
import Link from "next/link";
import { css } from "styled-system/css";
import { token } from "styled-system/tokens";
import i18n, { initI18n } from "../../i18n.server";

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
  if (!hasCaseViolation(c)) return "No violation detected.";
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
  const session = await getServerSession(authOptions);
  const cookieStore = await cookies();
  let lang = cookieStore.get("language")?.value;
  if (!lang) {
    const accept = (await headers()).get("accept-language") ?? "";
    const supported = ["en", "es", "fr"];
    for (const part of accept.split(",")) {
      const code = part.split(";")[0].trim().toLowerCase().split("-")[0];
      if (supported.includes(code)) {
        lang = code;
        break;
      }
    }
    lang = lang ?? "en";
  }
  await initI18n(lang);
  if (!session) {
    return <div className={css({ p: "8" })}>{i18n.t("notLoggedIn")}</div>;
  }
  const cases = getCases();
  if (cases.length === 0) {
    return (
      <div className={css({ p: "8" })}>
        <h1 className={css({ fontSize: "xl", fontWeight: "bold", mb: "4" })}>
          {i18n.t("caseTriage")}
        </h1>
        <p>{i18n.t("noCasesAvailable")}</p>
      </div>
    );
  }
  const triage = cases
    .map((c) => ({ case: c, severity: computeSeverity(c) }))
    .filter((t) => t.severity > 0)
    .sort((a, b) => b.severity - a.severity)
    .slice(0, 5);
  return (
    <div className={css({ p: "8" })}>
      <h1 className={css({ fontSize: "xl", fontWeight: "bold", mb: "4" })}>
        {i18n.t("caseTriage")}
      </h1>
      {triage.length === 0 ? (
        <p>{i18n.t("noOpenViolations")}</p>
      ) : (
        <ul className={css({ display: "grid", gap: "4" })}>
          {triage.map(({ case: c, severity }) => (
            <li key={c.id}>
              <Link
                href={`/cases/${c.id}`}
                className={css({
                  display: "block",
                  borderWidth: "1px",
                  p: "4",
                  _hover: {
                    backgroundColor: {
                      base: token("colors.gray.50"),
                      _dark: token("colors.gray.800"),
                    },
                  },
                })}
              >
                <p className={css({ fontWeight: "semibold" })}>
                  {i18n.t("caseLabel", { id: c.id })}
                </p>
                {c.analysis?.violationType ? (
                  <p>
                    {i18n.t("violationLabel", {
                      type: c.analysis.violationType,
                    })}
                  </p>
                ) : null}
                <p>
                  {i18n.t("severityLabel", {
                    severity: (severity * 100).toFixed(0),
                  })}
                </p>
                <p className={css({ mt: "2" })}>{nextAction(c)}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
