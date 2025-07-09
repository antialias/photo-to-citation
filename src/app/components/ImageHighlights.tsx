"use client";
import { getLocalizedText } from "@/lib/localizedText";
import type { ViolationReport } from "@/lib/openai";
import { useTranslation } from "react-i18next";
import { css } from "styled-system/css";
import InlineTranslateButton from "./InlineTranslateButton";

export default function ImageHighlights({
  analysis,
  photo,
  onTranslate,
}: {
  analysis: ViolationReport;
  photo: string;
  onTranslate?: (path: string, lang: string) => Promise<void> | void;
}) {
  const { i18n, t } = useTranslation();
  const name = photo.split("/").pop() || photo;
  const info = analysis.images?.[name];
  if (!info) return null;
  const { text: highlights, needsTranslation: needsHighlights } =
    getLocalizedText(info.highlights, i18n.language);
  const { text: context, needsTranslation: needsContext } = getLocalizedText(
    info.context,
    i18n.language,
  );
  const styles = {
    wrapper: css({
      display: "flex",
      flexDirection: "column",
      gap: "1",
      fontSize: "sm",
    }),
    bold: css({ fontWeight: "semibold" }),
  };
  return (
    <div className={styles.wrapper}>
      <span>
        <span className={styles.bold}>Image score:</span>{" "}
        {info.representationScore.toFixed(2)}
      </span>
      {highlights ? (
        <span>
          {highlights}
          {needsHighlights ? (
            <InlineTranslateButton
              lang={i18n.language}
              onTranslate={() =>
                onTranslate?.(
                  `analysis.images.${name}.highlights`,
                  i18n.language,
                )
              }
            />
          ) : null}
        </span>
      ) : null}
      {context ? (
        <span>
          {context}
          {needsContext ? (
            <InlineTranslateButton
              lang={i18n.language}
              onTranslate={() =>
                onTranslate?.(`analysis.images.${name}.context`, i18n.language)
              }
            />
          ) : null}
        </span>
      ) : null}
    </div>
  );
}
