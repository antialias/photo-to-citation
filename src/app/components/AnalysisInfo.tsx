import type { ViolationReport } from "@/lib/openai";
import EditableText from "./EditableText";

export default function AnalysisInfo({
  analysis,
  onPlateChange,
  onStateChange,
  onClearPlate,
  onClearState,
}: {
  analysis: ViolationReport;
  onPlateChange?: (v: string) => Promise<void> | void;
  onStateChange?: (v: string) => Promise<void> | void;
  onClearPlate?: () => Promise<void> | void;
  onClearState?: () => Promise<void> | void;
}) {
  const { violationType, details, location, vehicle = {} } = analysis;
  return (
    <div className="flex flex-col gap-1 text-sm">
      <p>
        <span className="font-semibold">Violation:</span> {violationType}
      </p>
      <p>{details}</p>
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
