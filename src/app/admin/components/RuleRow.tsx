"use client";
import type { CasbinRule } from "../AdminPageClient";
import type { GroupOptions, PolicyOptions } from "../hooks/useCasbinRules";

export default function RuleRow({
  rule,
  onChange,
  onRemove,
  policyOptions,
  groupOptions,
}: {
  rule: CasbinRule;
  onChange: (field: keyof Omit<CasbinRule, "id">, value: string) => void;
  onRemove: () => void;
  policyOptions: PolicyOptions;
  groupOptions: GroupOptions;
}) {
  const ptypeOptions = ["p", "g"];
  const v0Options =
    rule.ptype === "p" ? Object.keys(policyOptions) : Object.keys(groupOptions);
  const v1Options =
    rule.ptype === "p"
      ? rule.v0
        ? Object.keys(policyOptions[rule.v0] ?? {})
        : []
      : rule.v0
        ? (groupOptions[rule.v0] ?? [])
        : [];
  const v2Options =
    rule.ptype === "p" && rule.v0 && rule.v1
      ? (policyOptions[rule.v0][rule.v1] ?? [])
      : [];

  return (
    <tr>
      <td className="border">
        <select
          value={rule.ptype}
          onChange={(e) => onChange("ptype", e.target.value)}
          className="w-full p-1 bg-white dark:bg-gray-900"
        >
          {ptypeOptions.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </td>
      <td className="border">
        <select
          value={rule.v0 ?? ""}
          onChange={(e) => onChange("v0", e.target.value)}
          className="w-full p-1 bg-white dark:bg-gray-900"
        >
          {v0Options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </td>
      <td className="border">
        <select
          value={rule.v1 ?? ""}
          onChange={(e) => onChange("v1", e.target.value)}
          className="w-full p-1 bg-white dark:bg-gray-900"
        >
          {v1Options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </td>
      <td className="border">
        <select
          value={rule.v2 ?? ""}
          onChange={(e) => onChange("v2", e.target.value)}
          className="w-full p-1 bg-white dark:bg-gray-900"
        >
          {v2Options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </td>
      <td className="border">
        <input
          value={rule.v3 ?? ""}
          onChange={(e) => onChange("v3", e.target.value)}
          className="w-full p-1 bg-white dark:bg-gray-900"
        />
      </td>
      <td className="border">
        <input
          value={rule.v4 ?? ""}
          onChange={(e) => onChange("v4", e.target.value)}
          className="w-full p-1 bg-white dark:bg-gray-900"
        />
      </td>
      <td className="border">
        <input
          value={rule.v5 ?? ""}
          onChange={(e) => onChange("v5", e.target.value)}
          className="w-full p-1 bg-white dark:bg-gray-900"
        />
      </td>
      <td className="border">
        <button
          type="button"
          onClick={onRemove}
          className="bg-red-500 text-white px-2 py-1 rounded"
        >
          Delete
        </button>
      </td>
    </tr>
  );
}
