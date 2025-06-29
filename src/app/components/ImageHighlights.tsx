"use client";
import { getLocalizedText } from "@/lib/localizedText";
import type { ViolationReport } from "@/lib/openai";
import { useTranslation } from "react-i18next";
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
  return (
    <div className="flex flex-col gap-1 text-sm">
      <span>
        <span className="font-semibold">Image score:</span>{" "}
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
