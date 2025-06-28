import { getLocalizedText } from "@/lib/localizedText";
import type { ViolationReport } from "@/lib/openai";
import { US_STATES } from "@/lib/usStates";
import { useTranslation } from "react-i18next";
import EditableText from "./EditableText";

export default function AnalysisInfo({
  analysis,
  onPlateChange,
  onStateChange,
  onClearPlate,
  onClearState,
  onTranslate,
}: {
  analysis: ViolationReport;
  onPlateChange?: (v: string) => Promise<void> | void;
  onStateChange?: (v: string) => Promise<void> | void;
  onClearPlate?: () => Promise<void> | void;
  onClearState?: () => Promise<void> | void;
  onTranslate?: (path: string, lang: string) => Promise<void> | void;
}) {
  const { i18n, t } = useTranslation();
  const { violationType, details, location, vehicle = {} } = analysis;
  const { text: detailText, needsTranslation } = getLocalizedText(
    details,
    i18n.language,
  );
  return (
    <div className="flex flex-col gap-1 text-sm">
      <p>
        <span className="font-semibold">Violation:</span> {violationType}
      </p>
      <p>
        {detailText}
        {needsTranslation ? (
          <button
            type="button"
            onClick={() => onTranslate?.("analysis.details", i18n.language)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                onTranslate?.("analysis.details", i18n.language);
              }
            }}
            className="ml-2 text-blue-500 underline cursor-pointer bg-transparent border-0 p-0"
          >
            {t("translate")}
          </button>
        ) : null}
      </p>
      {location ? (
        <p>
          <span className="font-semibold">Location clues:</span> {location}
        </p>
      ) : null}
      <div className="pl-4 flex flex-col gap-1">
        {vehicle.make ? <span>Make: {vehicle.make}</span> : null}
        {vehicle.model ? <span>Model: {vehicle.model}</span> : null}
        {vehicle.type ? <span>Type: {vehicle.type}</span> : null}
        {vehicle.color ? <span>Color: {vehicle.color}</span> : null}
        {onPlateChange || onStateChange ? (
          <span className="inline-flex items-center gap-1">
            Plate:
            {onStateChange ? (
              <EditableText
                value={vehicle.licensePlateState ?? ""}
                onSubmit={onStateChange}
                onClear={onClearState}
                placeholder="state"
                options={US_STATES}
              />
            ) : vehicle.licensePlateState ? (
              <span>{vehicle.licensePlateState}</span>
            ) : null}
            {onPlateChange ? (
              <EditableText
                value={vehicle.licensePlateNumber ?? ""}
                onSubmit={onPlateChange}
                onClear={onClearPlate}
                placeholder="plate"
              />
            ) : vehicle.licensePlateNumber ? (
              <span>{vehicle.licensePlateNumber}</span>
            ) : null}
          </span>
        ) : vehicle.licensePlateState || vehicle.licensePlateNumber ? (
          <span>
            Plate:{" "}
            {vehicle.licensePlateState ? `${vehicle.licensePlateState} ` : ""}
            {vehicle.licensePlateNumber}
          </span>
        ) : null}
      </div>
    </div>
  );
}
