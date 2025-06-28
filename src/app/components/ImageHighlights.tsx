"use client";
import type { ViolationReport } from "@/lib/openai";
import { useTranslation } from "react-i18next";

export default function ImageHighlights({
  analysis,
  photo,
}: {
  analysis: ViolationReport;
  photo: string;
}) {
  const { i18n } = useTranslation();
  const name = photo.split("/").pop() || photo;
  const info = analysis.images?.[name];
  if (!info) return null;
  const highlights =
    typeof info.highlights === "string"
      ? info.highlights
      : (info.highlights?.[i18n.language] ??
        info.highlights?.en ??
        Object.values(info.highlights ?? {})[0]);
  const context =
    typeof info.context === "string"
      ? info.context
      : (info.context?.[i18n.language] ??
        info.context?.en ??
        Object.values(info.context ?? {})[0]);
  return (
    <div className="flex flex-col gap-1 text-sm">
      <span>
        <span className="font-semibold">Image score:</span>{" "}
        {info.representationScore.toFixed(2)}
      </span>
      {highlights ? <span>{highlights}</span> : null}
      {context ? <span>{context}</span> : null}
    </div>
  );
}
