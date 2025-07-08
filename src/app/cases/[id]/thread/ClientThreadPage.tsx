"use client";
import { apiFetch } from "@/apiClient";
import SnailMailStatusIcon from "@/components/SnailMailStatusIcon";
import ThumbnailImage from "@/components/thumbnail-image";
import type { Case, SentEmail, ThreadImage } from "@/lib/caseStore";
import { getThumbnailUrl } from "@/lib/clientThumbnails";
import { space } from "@/styleTokens";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FaArrowLeft, FaFileAlt, FaFilePdf } from "react-icons/fa";
import { css, cx } from "styled-system/css";
import { token } from "styled-system/tokens";
import { useNotify } from "../../../components/NotificationProvider";
import useCase, { caseQueryKey } from "../../../hooks/useCase";
import useEventSource from "../../../hooks/useEventSource";

function buildThread(c: Case, startId: string): SentEmail[] {
  const list = c.sentEmails ?? [];
  let current = list.find((m) => m.sentAt === startId);
  if (!current) return [];
  const chain: SentEmail[] = [];
  while (current) {
    chain.unshift(current);
    current = current.replyTo
      ? list.find((m) => m.sentAt === current?.replyTo)
      : undefined;
  }
  return chain;
}

export default function ClientThreadPage({
  caseId,
  initialCase,
  startId,
}: {
  caseId: string;
  initialCase: Case | null;
  startId: string;
}) {
  const queryClient = useQueryClient();
  const { data: caseData } = useCase(caseId, initialCase);
  const [viewImage, setViewImage] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const notify = useNotify();
  const { t } = useTranslation();

  useEventSource<Case & { deleted?: boolean }>("/api/cases/stream", (data) => {
    if (data.id !== caseId) return;
    if (data.deleted) {
      queryClient.setQueryData(caseQueryKey(caseId), null);
    } else {
      queryClient.setQueryData(caseQueryKey(caseId), data);
    }
  });

  async function uploadScan(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const form = new FormData();
    form.append("photo", file);
    form.append("replyTo", startId);
    const uploadRes = await apiFetch(`/api/cases/${caseId}/thread-images`, {
      method: "POST",
      body: form,
    });
    if (!uploadRes.ok) {
      notify(t("failedImageUpload"));
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    queryClient.invalidateQueries({ queryKey: caseQueryKey(caseId) });
    if (fileRef.current) fileRef.current.value = "";
  }

  async function attachEvidence(url: string) {
    const res = await apiFetch(`/api/cases/${caseId}/photos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photo: url }),
    });
    if (!res.ok) {
      notify(t("failedAttachEvidence"));
    }
  }

  if (!caseData) {
    return <div className={css({ p: space.container })}>{t("loading")}</div>;
  }

  const thread = buildThread(caseData, startId);
  const images: ThreadImage[] = (caseData.threadImages ?? []).filter(
    (i) => i.threadParent === startId,
  );

  const styles = {
    wrapper: css({
      p: space.container,
      display: "flex",
      flexDirection: "column",
      gap: space.gap,
    }),
    header: cx(
      css({
        position: "sticky",
        top: "14",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottomWidth: "1px",
        pb: "2",
        bg: token("colors.surface"),
      }),
    ),
    headerRow: css({ display: "flex", alignItems: "center", gap: "2" }),
    backLink: css({
      fontSize: "xl",
      p: "2",
      color: "blue.500",
      _hover: { color: "blue.700" },
    }),
    title: css({ fontSize: "xl", fontWeight: "semibold" }),
    actions: css({ display: "flex", gap: "2", alignItems: "center" }),
    uploadLabel: css({
      bg: { base: "gray.200", _dark: "gray.700" },
      px: "2",
      py: "1",
      rounded: "md",
      cursor: "pointer",
    }),
    hiddenInput: css({ display: "none" }),
    followupLink: css({
      bg: "blue.500",
      color: "white",
      px: "2",
      py: "1",
      rounded: "md",
    }),
    list: css({ display: "flex", flexDirection: "column", gap: space.gap }),
    listItem: css({ borderWidth: "1px", p: "2", rounded: "md" }),
    preBody: css({ whiteSpace: "pre-wrap", fontSize: "sm" }),
    attachmentsList: css({
      mt: "2",
      display: "flex",
      flexDirection: "column",
      gap: "1",
    }),
    attachmentItem: css({ display: "flex", alignItems: "center", gap: "2" }),
    attachmentLink: css({
      display: "flex",
      alignItems: "center",
      gap: "2",
      color: "blue.500",
      textDecorationLine: "underline",
    }),
    pdfIcon: css({ w: "8", h: "8", color: "red.600" }),
    fileIcon: css({ w: "8", h: "8" }),
    imageItem: css({
      borderWidth: "1px",
      p: "2",
      rounded: "md",
      display: "flex",
      gap: "2",
    }),
    imageThumbnail: css({ cursor: "pointer" }),
    imageInfo: css({
      display: "flex",
      flexDirection: "column",
      gap: "2",
      flex: "1",
    }),
    modal: css({
      position: "fixed",
      inset: "0",
      bg: "black/50",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      p: "4",
    }),
    modalContent: cx(
      css({ bg: token("colors.surface"), rounded: "md", shadow: "md" }),
      "max-w-3xl w-full",
    ),
    modalImageWrapper: css({ position: "relative", w: "full", h: "80vh" }),
    modalImage: css({
      objectFit: "contain",
      position: "absolute",
      inset: "0",
      w: "full",
      h: "full",
    }),
    modalClose: css({ display: "flex", justifyContent: "end", p: "2" }),
    closeButton: css({
      bg: token("colors.surface-subtle"),
      rounded: "md",
      px: "2",
      py: "1",
    }),
  };
  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <div className={styles.headerRow}>
          <Link
            href={`/cases/${caseId}`}
            aria-label={t("backToCase")}
            className={styles.backLink}
          >
            <FaArrowLeft />
          </Link>
          <h1 className={styles.title}>{t("thread")}</h1>
        </div>
        <div className={styles.actions}>
          <label className={styles.uploadLabel}>
            {t("uploadScan")}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={uploadScan}
              className={styles.hiddenInput}
            />
          </label>
          <Link
            href={`/cases/${caseId}/thread/${encodeURIComponent(startId)}?followup=1`}
            className={styles.followupLink}
          >
            {t("followUp")}
          </Link>
        </div>
      </div>
      <ul className={styles.list}>
        {thread.map((mail) => (
          <li key={mail.sentAt} className={styles.listItem}>
            <div
              className={cx(
                "text-sm",
                css({ color: token("colors.text-muted") }),
              )}
            >
              {new Date(mail.sentAt).toLocaleString()} - To: {mail.to}
            </div>
            <div className={css({ fontWeight: "semibold" })}>
              {mail.subject}
            </div>
            <pre className={styles.preBody}>{mail.body}</pre>
            {mail.snailMailStatus ? (
              <div className={css({ fontSize: "sm" })}>
                <SnailMailStatusIcon status={mail.snailMailStatus} />
              </div>
            ) : null}
            {mail.attachments && mail.attachments.length > 0 ? (
              <ul className={styles.attachmentsList}>
                <li className={css({ fontWeight: "semibold" })}>
                  {t("attachments")}
                </li>
                {mail.attachments.map((att) => {
                  const ext = att.toLowerCase().split(".").pop() ?? "";
                  const isImage = [
                    "jpg",
                    "jpeg",
                    "png",
                    "webp",
                    "gif",
                  ].includes(ext);
                  const isPdf = ext === "pdf";
                  return (
                    <li key={att} className={styles.attachmentItem}>
                      <a
                        href={`/uploads/${att}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.attachmentLink}
                      >
                        {isImage ? (
                          <ThumbnailImage
                            src={getThumbnailUrl(att, 128)}
                            alt={att}
                            width={64}
                            height={48}
                            imgClassName="object-contain"
                          />
                        ) : isPdf ? (
                          <FaFilePdf className={styles.pdfIcon} />
                        ) : (
                          <FaFileAlt className={styles.fileIcon} />
                        )}
                        <span>{att}</span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </li>
        ))}
        {images.map((img) => (
          <li key={img.id} className={styles.imageItem}>
            <ThumbnailImage
              src={getThumbnailUrl(img.url, 256)}
              alt="scan"
              width={150}
              height={100}
              className={styles.imageThumbnail}
              imgClassName="object-contain"
              onClick={() => setViewImage(`/uploads/${img.url}`)}
            />
            <div className={styles.imageInfo}>
              <button
                type="button"
                onClick={() => attachEvidence(img.url)}
                className={cx(
                  css({
                    bg: token("colors.surface-subtle"),
                    rounded: "md",
                    px: "2",
                    py: "1",
                  }),
                )}
              >
                {t("addAsEvidence")}
              </button>
              {img.ocrText ? (
                <pre
                  className={cx(
                    css({
                      whiteSpace: "pre-wrap",
                      fontSize: "sm",
                      rounded: "md",
                      bg: token("colors.surface-subtle"),
                      p: "2",
                    }),
                  )}
                >
                  {img.ocrText}
                </pre>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
      {viewImage ? (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalImageWrapper}>
              <img
                src={viewImage}
                alt="scan full size"
                className={styles.modalImage}
                loading="lazy"
              />
            </div>
            <div className={styles.modalClose}>
              <button
                type="button"
                onClick={() => setViewImage(null)}
                className={styles.closeButton}
              >
                {t("close")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
