"use client";
import { css } from "styled-system/css";
import { button } from "styled-system/recipes";
import { token } from "styled-system/tokens";
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

  const styles = {
    cell: css({ borderWidth: "1px" }),
    select: css({
      width: "100%",
      p: "1",
      backgroundColor: { base: "white", _dark: token("colors.gray.900") },
    }),
    input: css({
      width: "100%",
      p: "1",
      backgroundColor: { base: "white", _dark: token("colors.gray.900") },
    }),
    deleteBtn: button({ variant: "danger" }),
  };

  return (
    <tr>
      <td className={styles.cell}>
        <select
          value={rule.ptype}
          onChange={(e) => onChange("ptype", e.target.value)}
          className={styles.select}
        >
          {ptypeOptions.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </td>
      <td className={styles.cell}>
        <select
          value={rule.v0 ?? ""}
          onChange={(e) => onChange("v0", e.target.value)}
          className={styles.select}
        >
          {v0Options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </td>
      <td className={styles.cell}>
        <select
          value={rule.v1 ?? ""}
          onChange={(e) => onChange("v1", e.target.value)}
          className={styles.select}
        >
          {v1Options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </td>
      <td className={styles.cell}>
        <select
          value={rule.v2 ?? ""}
          onChange={(e) => onChange("v2", e.target.value)}
          className={styles.select}
        >
          {v2Options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </td>
      <td className={styles.cell}>
        <input
          value={rule.v3 ?? ""}
          onChange={(e) => onChange("v3", e.target.value)}
          className={styles.input}
        />
      </td>
      <td className={styles.cell}>
        <input
          value={rule.v4 ?? ""}
          onChange={(e) => onChange("v4", e.target.value)}
          className={styles.input}
        />
      </td>
      <td className={styles.cell}>
        <input
          value={rule.v5 ?? ""}
          onChange={(e) => onChange("v5", e.target.value)}
          className={styles.input}
        />
      </td>
      <td className={styles.cell}>
        <button type="button" onClick={onRemove} className={styles.deleteBtn}>
          Delete
        </button>
      </td>
    </tr>
  );
}
