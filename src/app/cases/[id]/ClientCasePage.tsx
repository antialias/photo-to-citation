"use client";

import CaseChat from "@/app/cases/[id]/CaseChat";
import useDragReset from "@/app/cases/useDragReset";
import CaseLayout from "@/app/components/CaseLayout";
import CaseProgressGraph from "@/app/components/CaseProgressGraph";
import DebugWrapper from "@/app/components/DebugWrapper";
import { useSession } from "@/app/useSession";
import type { Case } from "@/lib/caseStore";
import { space } from "@/styleTokens";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { css } from "styled-system/css";
import { token } from "styled-system/tokens";
import { CaseProvider, useCaseContext } from "./CaseContext";
import CaseDetails from "./components/CaseDetails";
import CaseExtraInfo from "./components/CaseExtraInfo";
import CaseHeader from "./components/CaseHeader";
import ClaimBanner from "./components/ClaimBanner";
import PhotoSection from "./components/PhotoSection";
import PublicViewBanner from "./components/PublicViewBanner";

function ClientCasePage({
  caseId,
  readOnly = false,
}: { caseId: string; readOnly?: boolean }) {
  const { caseData, uploadFiles } = useCaseContext();
  const { data: session } = useSession();
  const { t } = useTranslation();
  const [dragging, setDragging] = useState(false);
  const [hideClaimBanner, setHideClaimBanner] = useState(false);
  const [chatExpanded, setChatExpanded] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  useDragReset(() => setDragging(false));

  useEffect(() => {
    const stored = sessionStorage.getItem(`preview-${caseId}`);
    if (stored) setPreview(stored);
  }, [caseId]);

  const styles = {
    loadingWrapper: css({
      p: space.container,
      display: "flex",
      flexDirection: "column",
      gap: space.gap,
    }),
    loadingHeading: css({ fontSize: "xl", fontWeight: "semibold" }),
    loadingText: css({
      fontSize: "sm",
      color: {
        base: token("colors.gray.500"),
        _dark: token("colors.gray.400"),
      },
    }),
    container: (expanded: boolean) =>
      css({
        position: "relative",
        h: "full",
        display: expanded ? { md: "grid" } : undefined,
        gridTemplateColumns: expanded ? { md: "1fr 1fr" } : undefined,
        gap: expanded ? "4" : undefined,
        overflow: expanded ? "hidden" : undefined,
      }),
    col: css({ h: "full", overflowY: "auto" }),
    overlay: css({
      position: "absolute",
      inset: 0,
      backgroundColor: token("colors.overlay"),
      color: "white",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      pointerEvents: "none",
      fontSize: "xl",
      zIndex: "var(--z-nav)",
    }),
  };

  const showClaimBanner = Boolean(
    caseData?.sessionId && !session?.user && !hideClaimBanner,
  );

  if (!caseData) {
    return (
      <div className={styles.loadingWrapper}>
        <h1 className={styles.loadingHeading}>{t("uploading")}</h1>
        {preview ? (
          <img
            src={preview}
            alt="preview"
            className={css({ maxW: "full" })}
            loading="lazy"
          />
        ) : null}
        <p className={styles.loadingText}>{t("uploadingPhoto")}</p>
      </div>
    );
  }

  return (
    <div
      className={styles.container(chatExpanded)}
      onDragOver={readOnly ? undefined : (e) => e.preventDefault()}
      onDragEnter={
        readOnly
          ? undefined
          : (e) => {
              e.preventDefault();
              setDragging(true);
            }
      }
      onDragLeave={
        readOnly
          ? undefined
          : (e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                setDragging(false);
              }
            }
      }
      onDrop={
        readOnly
          ? undefined
          : async (e) => {
              e.preventDefault();
              await uploadFiles(e.dataTransfer.files);
              setDragging(false);
            }
      }
    >
      <ClaimBanner
        show={showClaimBanner}
        onDismiss={() => setHideClaimBanner(true)}
        className={
          chatExpanded ? css({ md: { gridColumn: "span 2" } }) : undefined
        }
      />
      <PublicViewBanner
        caseId={caseId}
        show={readOnly}
        className={
          chatExpanded ? css({ md: { gridColumn: "span 2" } }) : undefined
        }
      />
      <div className={chatExpanded ? styles.col : undefined}>
        <CaseLayout
          header={<CaseHeader caseId={caseId} readOnly={readOnly} />}
          left={<CaseProgressGraph caseData={caseData} />}
          right={
            <>
              <DebugWrapper data={caseData}>
                <CaseDetails readOnly={readOnly} />
              </DebugWrapper>
              <PhotoSection caseId={caseId} readOnly={readOnly} />
            </>
          }
        >
          <CaseExtraInfo caseId={caseId} />
        </CaseLayout>
      </div>
      {readOnly || !dragging ? null : (
        <div className={styles.overlay} data-testid="drag-overlay">
          {t("dropToAddPhotos")}
        </div>
      )}
      {readOnly ? null : (
        <div className={chatExpanded ? styles.col : undefined}>
          <CaseChat
            caseId={caseId}
            expanded={chatExpanded}
            onExpandChange={setChatExpanded}
          />
        </div>
      )}
    </div>
  );
}

export default function ClientCasePageWithProvider(props: {
  initialCase: Case | null;
  caseId: string;
  readOnly?: boolean;
}) {
  return (
    <CaseProvider caseId={props.caseId} initialCase={props.initialCase}>
      <ClientCasePage caseId={props.caseId} readOnly={props.readOnly} />
    </CaseProvider>
  );
}
