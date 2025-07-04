"use client";
import { useTranslation } from "react-i18next";
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
  return (
    <div>
      <table className="mb-2 border-collapse w-full">
        <thead>
          <tr>
            <th className="border px-1">ptype</th>
            <th className="border px-1">v0</th>
            <th className="border px-1">v1</th>
            <th className="border px-1">v2</th>
            <th className="border px-1">v3</th>
            <th className="border px-1">v4</th>
            <th className="border px-1">v5</th>
            <th className="border px-1" />
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
      <div className="flex gap-2 mb-2">
        <button
          type="button"
          onClick={addRule}
          className="bg-green-600 text-white px-2 py-1 rounded"
        >
          {t("admin.addRule")}
        </button>
      </div>
      <button
        type="button"
        onClick={() => saveRulesMutation.mutate()}
        disabled={!isSuperadmin}
        className="bg-blue-600 text-white px-2 py-1 rounded disabled:opacity-50"
      >
        {t("admin.saveRules")}
      </button>
    </div>
  );
}
