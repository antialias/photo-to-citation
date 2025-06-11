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
    <div className="bg-gray-50 p-2 rounded text-sm flex flex-col gap-1">
      <span>
        <span className="font-semibold">Image score:</span>{" "}
        {info.representationScore.toFixed(2)}
      </span>
      {info.highlights ? <span>{info.highlights}</span> : null}
    </div>
  );
}
