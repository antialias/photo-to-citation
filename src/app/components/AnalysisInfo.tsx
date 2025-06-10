import type { ViolationReport } from "@/lib/openai";

export default function AnalysisInfo({
  analysis,
}: { analysis: ViolationReport }) {
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
        {vehicle.licensePlateState || vehicle.licensePlateNumber ? (
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
