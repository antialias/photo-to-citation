"use client";
import type { ViolationReport } from "@/lib/openai";

export default function ImageHighlights({
  analysis,
  photo,
}: {
  analysis: ViolationReport;
  photo: string;
}) {
  const name = photo.split("/").pop() || photo;
  const info = analysis.images?.[name];
  if (!info) return null;
  return (
    <div className="flex flex-col gap-1 text-sm">
      <span>
        <span className="font-semibold">Image score:</span>{" "}
        {info.representationScore.toFixed(2)}
      </span>
      {info.highlights ? <span>{info.highlights}</span> : null}
      {info.context ? <span>{info.context}</span> : null}
    </div>
  );
}
