import type { ViolationReport } from "./openai";

export function mergeAnalysis(
  base: ViolationReport | null | undefined,
  overrides: Partial<ViolationReport> | null | undefined,
): ViolationReport | null {
  if (!base) return null;
  if (!overrides) return base;
  return {
    ...base,
    ...overrides,
    vehicle: {
      ...base.vehicle,
      ...(overrides.vehicle ?? {}),
    },
  };
}
