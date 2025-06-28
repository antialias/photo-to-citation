"use client";
import { apiFetch } from "@/apiClient";
import { getLocalizedText } from "@/lib/localizedText";
import type { ViolationReport } from "@/lib/openai";
import { useTranslation } from "react-i18next";

export default function ImageHighlights({
  analysis,
  photo,
  caseId,
}: {
  analysis: ViolationReport;
  photo: string;
  caseId?: string;
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
  async function translate(field: "highlights" | "context") {
    if (!caseId) return;
    const path = `analysis.images[${name}].${field}`;
    await apiFetch(`/api/cases/${caseId}/translate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path, lang: i18n.language }),
    });
  }
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
            <button
              type="button"
              onClick={() => translate("highlights")}
              className="ml-2 text-blue-500 underline"
            >
              {t("translate")}
            </button>
          ) : null}
        </span>
      ) : null}
      {context ? (
        <span>
          {context}
          {needsContext ? (
            <button
              type="button"
              onClick={() => translate("context")}
              className="ml-2 text-blue-500 underline"
            >
              {t("translate")}
            </button>
          ) : null}
        </span>
      ) : null}
    </div>
  );
}
