import type { Case } from "@/lib/caseStore";

export default function CaseSummary({ cases }: { cases: Case[] }) {
  if (cases.length === 0) return null;
  const first = cases[0];
  function allEqual<T>(getter: (c: Case) => T): T | undefined {
    const value = getter(first);
    return cases.every((c) => getter(c) === value) ? value : undefined;
  }
  const violation = allEqual((c) => c.analysis?.violationType);
  const plateNum = allEqual((c) => c.analysis?.vehicle?.licensePlateNumber);
  const plateState = allEqual((c) => c.analysis?.vehicle?.licensePlateState);
  const vin = allEqual((c) => c.vin);

  return (
    <div className="p-8 flex flex-col gap-2">
      <h1 className="text-xl font-semibold">Case Summary</h1>
      <p className="text-sm text-gray-500">{cases.length} cases selected.</p>
      {violation ? <p>Violation: {violation}</p> : null}
      {plateNum || plateState ? (
        <p>
          Plate: {plateState ? `${plateState} ` : ""}
          {plateNum}
        </p>
      ) : null}
      {vin ? <p>VIN: {vin}</p> : null}
    </div>
  );
}
