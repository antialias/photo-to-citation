"use client";
import { apiFetch } from "@/apiClient";
import type { OwnershipModule } from "@/lib/ownershipModules";
import { US_STATES } from "@/lib/usStates";
import { space } from "@/styleTokens";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { css, cx } from "styled-system/css";
import { token } from "styled-system/tokens";
import { useNotify } from "../../../components/NotificationProvider";
import { useSession } from "../../../useSession";

export default function OwnershipEditor({
  caseId,
  module,
  showPdf = false,
}: {
  caseId: string;
  module: Omit<OwnershipModule, "requestVin" | "requestContactInfo">;
  showPdf?: boolean;
}) {
  const [checkNumber, setCheckNumber] = useState("");
  const [form, setForm] = useState<Record<string, string>>({
    reasonForRequestingRecords: "private investigation",
    reasonH: "true",
    requesterDriverLicenseState: "IL",
  });
  const [option, setOption] = useState<string>("titleSearch");
  const [microfilmWithSearchOption, setMicrofilmWithSearchOption] =
    useState(false);
  const [microfilmOnly, setMicrofilmOnly] = useState(false);
  const [snailMailResult, setSnailMailResult] = useState<
    { status: string; error?: string } | undefined
  >();
  const [checkResult, setCheckResult] = useState<
    { status: string; error?: string } | undefined
  >();
  const notify = useNotify();
  const router = useRouter();
  const { t } = useTranslation();
  const { data: session } = useSession();

  useEffect(() => {
    if (session?.user) {
      const { name, email } = session.user;
      setForm((f) => ({
        ...f,
        requesterName: name ?? "",
        requesterEmailAddress: email ?? "",
      }));
    }
  }, [session]);

  useEffect(() => {
    if (session?.user) {
      apiFetch("/api/profile")
        .then((r) => r.json())
        .then(
          (p: {
            address?: string;
            cityStateZip?: string;
            daytimePhone?: string;
            driverLicenseNumber?: string;
            driverLicenseState?: string;
          }) => {
            setForm((f) => ({
              ...f,
              requesterAddress: p.address ?? f.requesterAddress ?? "",
              requesterCityStateZip:
                p.cityStateZip ?? f.requesterCityStateZip ?? "",
              requesterDaytimePhoneNumber:
                p.daytimePhone ?? f.requesterDaytimePhoneNumber ?? "",
              requesterDriverLicenseNumber:
                p.driverLicenseNumber ?? f.requesterDriverLicenseNumber ?? "",
              requesterDriverLicenseState:
                p.driverLicenseState ?? f.requesterDriverLicenseState ?? "IL",
            }));
          },
        )
        .catch(() => {});
    }
  }, [session]);

  const optionCost = useMemo(() => {
    let cost = 0;
    switch (option) {
      case "certifiedTitleSearch":
      case "certifiedRegistrationSearch":
        cost += 10;
        break;
      case "titleSearch":
      case "registrationSearch":
        cost += 5;
        break;
      default:
        break;
    }
    if (microfilmOnly) {
      cost += 5;
    }
    return cost;
  }, [option, microfilmOnly]);

  const total = module.fee + optionCost;

  const pdfUrl = useMemo(() => {
    const params = new URLSearchParams(form);
    params.set(option, "true");
    if (microfilmWithSearchOption) {
      params.set("microfilmWithSearchOption", "true");
    }
    if (microfilmOnly) {
      params.set("microfilmOnly", "true");
    }
    return `/api/cases/${caseId}/ownership-form?${params.toString()}`;
  }, [caseId, form, option, microfilmWithSearchOption, microfilmOnly]);

  async function record() {
    setSnailMailResult({ status: "sending" });
    const res = await apiFetch(`/api/cases/${caseId}/ownership-request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        moduleId: module.id,
        checkNumber,
        snailMail: true,
        form: {
          ...form,
          [option]: true,
          ...(microfilmWithSearchOption
            ? { microfilmWithSearchOption: true }
            : {}),
          ...(microfilmOnly ? { microfilmOnly: true } : {}),
        },
      }),
    });
    if (session?.user) {
      await apiFetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: form.requesterAddress,
          cityStateZip: form.requesterCityStateZip,
          daytimePhone: form.requesterDaytimePhoneNumber,
          driverLicenseNumber: form.requesterDriverLicenseNumber,
          driverLicenseState: form.requesterDriverLicenseState,
        }),
      }).catch(() => {});
    }
    if (res.ok) {
      const data = (await res.json()) as {
        case: { sentEmails?: { sentAt: string }[] };
        results: Record<string, { success: boolean; error?: string }>;
      };
      const snail = data.results?.snailMail;
      if (snail) {
        setSnailMailResult(
          snail.success
            ? { status: "success" }
            : { status: "error", error: snail.error },
        );
      }
      const chk = data.results?.check;
      if (chk) {
        setCheckResult(
          chk.success
            ? { status: "success" }
            : { status: "error", error: chk.error },
        );
      }
      const newEmail = data.case.sentEmails?.at(-1);
      const url = newEmail
        ? `/cases/${caseId}/thread/${encodeURIComponent(newEmail.sentAt)}`
        : null;
      if (url) {
        router.push(url);
        return;
      }
      notify(t("requestRecorded"));
    } else {
      setSnailMailResult({ status: "error", error: res.statusText });
      notify(t("requestRecorded"));
    }
  }

  const styles = {
    wrapper: css({
      p: space.container,
      display: "flex",
      flexDirection: "column",
      gap: space.gap,
    }),
    title: css({ fontSize: "xl", fontWeight: "semibold" }),
    pre: cx(
      "p-2 whitespace-pre-wrap",
      css({ bg: token("colors.surface-subtle") }),
    ),
    iframe: css({ w: "full", h: "96", borderWidth: "1px" }),
    labelCol: css({ display: "flex", flexDirection: "column" }),
    input: css({ borderWidth: "1px", p: "1" }),
    checkboxLabel: css({
      display: "flex",
      alignItems: "center",
      gap: "2",
      mt: "2",
    }),
    button: css({
      bg: "blue.500",
      color: "white",
      px: "2",
      py: "1",
      rounded: "md",
    }),
    error: css({ color: "red.600", fontSize: "sm" }),
    success: css({ color: "green.700", fontSize: "sm" }),
  };
  return (
    <div className={styles.wrapper}>
      <h1 className={styles.title}>{t("ownershipRequest")}</h1>
      <p>
        {t("stateLabel")} {module.state}
      </p>
      <p>{t("sendCheckTo", { fee: total })}</p>
      <pre className={styles.pre}>{module.address}</pre>
      {showPdf ? (
        <iframe src={pdfUrl} className={styles.iframe} title="Ownership form" />
      ) : null}
      <label className={styles.labelCol}>
        Name
        <input
          type="text"
          value={form.requesterName ?? ""}
          onChange={(e) =>
            setForm((f) => ({ ...f, requesterName: e.target.value }))
          }
          className={styles.input}
        />
      </label>
      <label className={styles.labelCol}>
        Email
        <input
          type="text"
          value={form.requesterEmailAddress ?? ""}
          onChange={(e) =>
            setForm((f) => ({ ...f, requesterEmailAddress: e.target.value }))
          }
          className={styles.input}
        />
      </label>
      <label className={styles.labelCol}>
        Address
        <input
          type="text"
          value={form.requesterAddress ?? ""}
          onChange={(e) =>
            setForm((f) => ({ ...f, requesterAddress: e.target.value }))
          }
          className={styles.input}
        />
      </label>
      <label className={styles.labelCol}>
        City/State/Zip
        <input
          type="text"
          value={form.requesterCityStateZip ?? ""}
          onChange={(e) =>
            setForm((f) => ({ ...f, requesterCityStateZip: e.target.value }))
          }
          className={styles.input}
        />
      </label>
      <label className={styles.labelCol}>
        Daytime Phone
        <input
          type="text"
          value={form.requesterDaytimePhoneNumber ?? ""}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              requesterDaytimePhoneNumber: e.target.value,
            }))
          }
          className={styles.input}
        />
      </label>
      <label className={styles.labelCol}>
        {t("driverLicenseNumberLabel")}
        <input
          type="text"
          value={form.requesterDriverLicenseNumber ?? ""}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              requesterDriverLicenseNumber: e.target.value,
            }))
          }
          className={styles.input}
        />
      </label>
      <label className={styles.labelCol}>
        {t("driverLicenseStateLabel")}
        <select
          value={form.requesterDriverLicenseState ?? "IL"}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              requesterDriverLicenseState: e.target.value,
            }))
          }
          className={styles.input}
        >
          {US_STATES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>
      <label className={styles.labelCol}>
        Section 2
        <select
          value={option}
          onChange={(e) => setOption(e.target.value)}
          className={styles.input}
        >
          <option value="titleSearch">Title Search — $5 each</option>
          <option value="registrationSearch">
            Registration Search — $5 each
          </option>
          <option value="certifiedTitleSearch">
            Certified Title Search — $10 each
          </option>
          <option value="certifiedRegistrationSearch">
            Certified Registration Search — $10 each
          </option>
        </select>
      </label>
      <label className={styles.checkboxLabel}>
        <input
          type="checkbox"
          checked={microfilmWithSearchOption}
          onChange={(e) => setMicrofilmWithSearchOption(e.target.checked)}
        />
        <span>Microfilm Requested with any Search Option, no charge</span>
      </label>
      <label className={styles.checkboxLabel}>
        <input
          type="checkbox"
          checked={microfilmOnly}
          onChange={(e) => setMicrofilmOnly(e.target.checked)}
        />
        <span>Microfilm Only — $5</span>
      </label>
      <label className={styles.labelCol}>
        {t("checkNumberLabel")}
        <input
          type="text"
          value={checkNumber}
          onChange={(e) => setCheckNumber(e.target.value)}
          className={styles.input}
        />
      </label>
      <button type="button" onClick={() => record()} className={styles.button}>
        {t("sendSnailMailRequest")}
      </button>
      {snailMailResult?.status === "error" && (
        <span className={styles.error}>{snailMailResult.error}</span>
      )}
      {checkResult?.status === "success" && (
        <span className={styles.success}>{t("checkGenerated")}</span>
      )}
      {checkResult?.status === "error" && (
        <span className={styles.error}>
          {t("checkGenerationFailed", { reason: checkResult.error })}
        </span>
      )}
    </div>
  );
}
