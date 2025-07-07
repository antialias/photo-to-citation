"use client";

import type { Case } from "@/lib/caseStore";
import {
  getCaseOwnerContact,
  getCasePlateNumber,
  getCasePlateState,
  getCaseVin,
  hasCaseViolation,
} from "@/lib/caseUtils";
import { useTranslation } from "react-i18next";
import { css, cx } from "styled-system/css";
import { token } from "styled-system/tokens";
import MultiCaseToolbar from "./MultiCaseToolbar";

export default function CaseSummary({ cases }: { cases: Case[] }) {
  if (cases.length === 0) return null;
  const first = cases[0];
  function allEqual<T>(getter: (c: Case) => T): T | undefined {
    const value = getter(first);
    return cases.every((c) => getter(c) === value) ? value : undefined;
  }
  const violation = allEqual((c) =>
    hasCaseViolation(c) ? c.analysis?.violationType : undefined,
  );
  const plateNum = allEqual((c) => getCasePlateNumber(c));
  const plateState = allEqual((c) => getCasePlateState(c));
  const vin = allEqual((c) => getCaseVin(c));
  const contact = allEqual((c) => getCaseOwnerContact(c));

  const actionsDisabled = !cases.every(
    (c) => c.analysisStatus === "complete" && hasCaseViolation(c),
  );
  const hasOwnerAll = cases.every((c) => Boolean(getCaseOwnerContact(c)));
  const ids = cases.map((c) => c.id);
  const { t } = useTranslation();

  return (
    <div className="flex flex-col">
      <MultiCaseToolbar
        caseIds={ids}
        disabled={actionsDisabled}
        hasOwner={hasOwnerAll}
      />
      <div className="p-8 flex flex-col gap-2">
        <h1 className="text-xl font-semibold">{t("caseSummary")}</h1>
        <p
          className={cx("text-sm", css({ color: token("colors.text-muted") }))}
        >
          {t("casesSelected", { count: cases.length })}
        </p>
        {violation ? (
          <p>
            {t("violation")} {violation}
          </p>
        ) : null}
        {plateNum || plateState ? (
          <p>
            {t("plate")} {plateState ? `${plateState} ` : ""}
            {plateNum}
          </p>
        ) : null}
        {vin ? (
          <p>
            {t("vin")} {vin}
          </p>
        ) : null}
        {contact ? (
          <p>
            {t("ownerContact")} {contact}
          </p>
        ) : null}
      </div>
    </div>
  );
}
