"use client";
import { useTranslation } from "react-i18next";
import { css } from "styled-system/css";
import { token } from "styled-system/tokens";
import type { useCasbinRules } from "../hooks/useCasbinRules";
import RuleRow from "./RuleRow";

export default function RulesTable({
  hooks,
}: { hooks: ReturnType<typeof useCasbinRules> }) {
  const {
    rules,
    updateRule,
    addRule,
    removeRule,
    saveRulesMutation,
    isSuperadmin,
    policyOptions,
    groupOptions,
  } = hooks;
  const { t } = useTranslation();

  const styles = {
    table: css({ mb: "2", borderCollapse: "collapse", width: "100%" }),
    addWrapper: css({ display: "flex", gap: "2", mb: "2" }),
    addBtn: css({
      bg: "green.600",
      color: "white",
      px: "2",
      py: "1",
      borderRadius: token("radii.md"),
    }),
    saveBtn: css({
      bg: "blue.600",
      color: "white",
      px: "2",
      py: "1",
      borderRadius: token("radii.md"),
      _disabled: { opacity: 0.5 },
    }),
    headerCell: css({ borderWidth: "1px", px: "1" }),
  };
  return (
    <div>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.headerCell}>ptype</th>
            <th className={styles.headerCell}>v0</th>
            <th className={styles.headerCell}>v1</th>
            <th className={styles.headerCell}>v2</th>
            <th className={styles.headerCell}>v3</th>
            <th className={styles.headerCell}>v4</th>
            <th className={styles.headerCell}>v5</th>
            <th className={styles.headerCell} />
          </tr>
        </thead>
        <tbody>
          {rules.map((r) => (
            <RuleRow
              key={r.id}
              rule={r}
              onChange={(field, value) => updateRule(r.id, field, value)}
              onRemove={() => removeRule(r.id)}
              policyOptions={policyOptions}
              groupOptions={groupOptions}
            />
          ))}
        </tbody>
      </table>
      <div className={styles.addWrapper}>
        <button type="button" onClick={addRule} className={styles.addBtn}>
          {t("admin.addRule")}
        </button>
      </div>
      <button
        type="button"
        onClick={() => saveRulesMutation.mutate()}
        disabled={!isSuperadmin}
        className={styles.saveBtn}
      >
        {t("admin.saveRules")}
      </button>
    </div>
  );
}
