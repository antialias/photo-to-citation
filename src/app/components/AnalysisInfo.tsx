import { getLocalizedText } from "@/lib/localizedText";
import type { ViolationReport } from "@/lib/openai";
import { US_STATES } from "@/lib/usStates";
import { useTranslation } from "react-i18next";
import { css } from "styled-system/css";
import EditableText from "./EditableText";
import InlineTranslateButton from "./InlineTranslateButton";

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
  const styles = {
    wrapper: css({
      display: "flex",
      flexDirection: "column",
      gap: "1",
      fontSize: "sm",
    }),
    innerWrapper: css({
      pl: "4",
      display: "flex",
      flexDirection: "column",
      gap: "1",
    }),
    plateRow: css({ display: "inline-flex", alignItems: "center", gap: "1" }),
    bold: css({ fontWeight: "semibold" }),
  };
  return (
    <div className={styles.wrapper}>
      <p>
        <span className={styles.bold}>Violation:</span> {violationType}
      </p>
      <p>
        {detailText}
        {needsTranslation ? (
          <InlineTranslateButton
            lang={i18n.language}
            onTranslate={() => onTranslate?.("analysis.details", i18n.language)}
          />
        ) : null}
      </p>
      {location ? (
        <p>
          <span className={styles.bold}>Location clues:</span> {location}
        </p>
      ) : null}
      <div className={styles.innerWrapper}>
        {vehicle.make ? <span>Make: {vehicle.make}</span> : null}
        {vehicle.model ? <span>Model: {vehicle.model}</span> : null}
        {vehicle.type ? <span>Type: {vehicle.type}</span> : null}
        {vehicle.color ? <span>Color: {vehicle.color}</span> : null}
        {onPlateChange || onStateChange ? (
          <span className={styles.plateRow}>
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
        {vehicle.plateCategoryOptions &&
        vehicle.plateCategoryOptions.length > 0 ? (
          <span>
            {t("plateCategories")}: {vehicle.plateCategoryOptions.join(", ")}
          </span>
        ) : null}
      </div>
    </div>
  );
}
