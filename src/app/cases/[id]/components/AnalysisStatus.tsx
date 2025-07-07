"use client";
import AnalysisInfo from "@/app/components/AnalysisInfo";
import { useTranslation } from "react-i18next";
import { css, cx } from "styled-system/css";
import { token } from "styled-system/tokens";
import useCaseTranslate from "../../../useCaseTranslate";
import { useCaseContext } from "../CaseContext";
import useCaseActions from "../useCaseActions";
import useCaseProgress from "../useCaseProgress";

export default function AnalysisStatus({
  readOnly = false,
}: { readOnly?: boolean }) {
  const { caseId, caseData } = useCaseContext();
  const { i18n } = useTranslation();
  const translate = useCaseTranslate(caseId);
  const {
    updatePlateNumber,
    updatePlateState,
    clearPlateNumber,
    clearPlateState,
    retryAnalysis,
    reanalyzingPhoto,
  } = useCaseActions();
  const { progress, progressDescription } = useCaseProgress(reanalyzingPhoto);
  if (!caseData) return null;

  const plateNumberOverridden =
    caseData.analysisOverrides?.vehicle?.licensePlateNumber !== undefined;
  const plateStateOverridden =
    caseData.analysisOverrides?.vehicle?.licensePlateState !== undefined;

  const bugReportUrl =
    "https://github.com/antialias/photo-to-citation/issues/new";

  const failureReason = caseData.analysisError
    ? caseData.analysisError === "truncated"
      ? "Analysis failed because the AI response was cut off."
      : caseData.analysisError === "parse"
        ? "Analysis failed due to invalid JSON from the AI."
        : caseData.analysisError === "schema"
          ? "Analysis failed because the AI response did not match the expected schema."
          : caseData.analysisError === "images"
            ? "Analysis failed because no images were provided or some photo files were missing."
            : "Analysis failed because the AI response did not match the expected format."
    : caseData.analysisStatusCode && caseData.analysisStatusCode >= 400
      ? "Analysis failed. Please try again later."
      : "Analysis failed.";

  let failureDetail: string | null = null;
  let failureFix: React.ReactNode = null;
  switch (caseData.analysisError) {
    case "truncated":
      failureDetail =
        "The AI response ended early, which usually means the output was too long.";
      failureFix = (
        <p className="mt-1">
          Click{" "}
          {readOnly ? (
            "retry"
          ) : (
            <button type="button" onClick={retryAnalysis} className="underline">
              retry
            </button>
          )}{" "}
          to try again. If it keeps failing,{" "}
          <a
            href={bugReportUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            file a bug report
          </a>
          .
        </p>
      );
      break;
    case "parse":
      failureDetail = "The AI returned text that could not be parsed as JSON.";
      failureFix = (
        <p className="mt-1">
          {readOnly ? null : (
            <>
              Click{" "}
              <button
                type="button"
                onClick={retryAnalysis}
                className="underline"
              >
                retry
              </button>{" "}
              to try again.
            </>
          )}
          {" If it keeps failing, "}
          <a
            href={bugReportUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            report this issue
          </a>
          .
        </p>
      );
      break;
    case "schema":
      failureDetail = "The AI's JSON did not match the expected schema.";
      failureFix = (
        <p className="mt-1">
          {readOnly ? null : (
            <>
              Click{" "}
              <button
                type="button"
                onClick={retryAnalysis}
                className="underline"
              >
                retry
              </button>{" "}
              to try again.
            </>
          )}
          {" If the problem persists, "}
          <a
            href={bugReportUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            file a bug report
          </a>
          .
        </p>
      );
      break;
    case "images":
      failureDetail = "One or more uploaded photos were missing.";
      failureFix = (
        <p className="mt-1">
          Ensure all photos are uploaded correctly, then{" "}
          {readOnly ? (
            "retry"
          ) : (
            <button type="button" onClick={retryAnalysis} className="underline">
              retry analysis
            </button>
          )}
          .
        </p>
      );
      break;
    default:
      if (caseData.analysisStatusCode && caseData.analysisStatusCode >= 500) {
        failureDetail = "The server encountered an error while analyzing.";
        failureFix = (
          <p className="mt-1">
            Please try again later. If the problem continues,{" "}
            <a
              href={bugReportUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              file a bug report
            </a>
            .
          </p>
        );
      } else if (
        caseData.analysisStatusCode &&
        caseData.analysisStatusCode >= 400
      ) {
        failureDetail = "The request to analyze the case was rejected.";
        failureFix = (
          <p className="mt-1">
            Check your inputs and try again. If you believe this is a mistake,{" "}
            <a
              href={bugReportUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              report this issue
            </a>
            .
          </p>
        );
      }
  }

  if (caseData.analysis) {
    return (
      <AnalysisInfo
        analysis={caseData.analysis}
        onPlateChange={readOnly ? undefined : updatePlateNumber}
        onStateChange={readOnly ? undefined : updatePlateState}
        onClearPlate={
          readOnly
            ? undefined
            : plateNumberOverridden
              ? clearPlateNumber
              : undefined
        }
        onClearState={
          readOnly
            ? undefined
            : plateStateOverridden
              ? clearPlateState
              : undefined
        }
        onTranslate={() => translate("analysis.details", i18n.language)}
      />
    );
  }

  if (caseData.analysisStatus === "canceled") {
    return <p className="text-sm text-red-600">Analysis canceled.</p>;
  }

  if (caseData.analysisStatus === "pending" && progress) {
    return (
      <p className={cx("text-sm", css({ color: token("colors.text-muted") }))}>
        {progressDescription}
      </p>
    );
  }

  return (
    <div className="text-sm text-red-600 flex flex-col gap-1">
      <p>{failureReason}</p>
      {readOnly ? null : (
        <button
          type="button"
          onClick={retryAnalysis}
          className="underline w-fit"
        >
          Retry
        </button>
      )}
      <details>
        <summary className="cursor-pointer underline">More info</summary>
        <p className="mt-1">
          Last attempt: {new Date(caseData.updatedAt).toLocaleString()}
        </p>
        {failureDetail ? <p className="mt-1">{failureDetail}</p> : null}
        {caseData.analysisStatusCode ? (
          <p className="mt-1">Status code: {caseData.analysisStatusCode}</p>
        ) : null}
        {failureFix}
      </details>
    </div>
  );
}
