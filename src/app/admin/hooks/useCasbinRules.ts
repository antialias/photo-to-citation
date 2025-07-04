import { apiFetch } from "@/apiClient";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import type { CasbinRule, RuleInput } from "../AdminPageClient";

export type PolicyOptions = Record<string, Record<string, readonly string[]>>;
export type GroupOptions = Record<string, readonly string[]>;

const CRUD_ACTIONS = ["create", "read", "update", "delete"] as const;
const DEFAULT_ROLES = ["anonymous", "user", "admin", "superadmin"] as const;

function derivePolicyOptions(rules: RuleInput[]): PolicyOptions {
  const roles = new Set<string>(DEFAULT_ROLES);
  const objects = new Set<string>();
  for (const r of rules) {
    if (r.ptype !== "p") continue;
    if (r.v0) roles.add(r.v0);
    if (r.v1) objects.add(r.v1);
  }
  const opts: PolicyOptions = {};
  for (const role of roles) {
    opts[role] = {};
    for (const obj of objects) {
      opts[role][obj] = CRUD_ACTIONS;
    }
  }
  return opts;
}

function deriveGroupOptions(rules: RuleInput[]): GroupOptions {
  const opts: Record<string, Set<string>> = {};
  for (const r of rules) {
    if (r.ptype !== "g" || !r.v0 || !r.v1) continue;
    if (!opts[r.v0]) opts[r.v0] = new Set();
    opts[r.v0].add(r.v1);
  }
  const result: GroupOptions = {};
  for (const [k, v] of Object.entries(opts)) result[k] = Array.from(v);
  return result;
}

function normalizeRule(
  rule: RuleInput,
  pOpts: PolicyOptions,
  gOpts: GroupOptions,
): RuleInput {
  if (rule.ptype === "p") {
    const v0s = Object.keys(pOpts);
    if (!rule.v0 || !v0s.includes(rule.v0)) rule.v0 = v0s[0];
    const v1s = Object.keys(pOpts[rule.v0]);
    if (!rule.v1 || !v1s.includes(rule.v1)) rule.v1 = v1s[0];
    const v2s = pOpts[rule.v0][rule.v1];
    if (!rule.v2 || !v2s.includes(rule.v2)) rule.v2 = v2s[0];
  } else {
    const v0s = Object.keys(gOpts);
    if (!rule.v0 || !v0s.includes(rule.v0)) rule.v0 = v0s[0];
    const v1s = gOpts[rule.v0];
    if (!rule.v1 || !v1s.includes(rule.v1)) rule.v1 = v1s[0];
    rule.v2 = null;
  }
  return rule;
}

export function useCasbinRules(
  initialRules: RuleInput[],
  isSuperadmin: boolean,
) {
  const [policyOptions, setPolicyOptions] = useState(() =>
    derivePolicyOptions(initialRules),
  );
  const [groupOptions, setGroupOptions] = useState(() =>
    deriveGroupOptions(initialRules),
  );
  const [rules, setRules] = useState(() =>
    initialRules.map((r) => ({
      ...normalizeRule(r, policyOptions, groupOptions),
      id: crypto.randomUUID(),
    })),
  );

  function updateRule(
    id: string,
    field: keyof Omit<CasbinRule, "id">,
    value: string,
  ) {
    setRules((curr) =>
      curr.map((r) =>
        r.id === id
          ? {
              ...normalizeRule(
                { ...r, [field]: value },
                policyOptions,
                groupOptions,
              ),
              id: r.id,
            }
          : r,
      ),
    );
  }

  function addRule() {
    const base = normalizeRule({ ptype: "p" }, policyOptions, groupOptions);
    setRules((curr) => [...curr, { ...base, id: crypto.randomUUID() }]);
  }

  function removeRule(id: string) {
    setRules((curr) => curr.filter((r) => r.id !== id));
  }

  const saveRulesMutation = useMutation({
    async mutationFn() {
      if (!isSuperadmin) return;
      const cleaned = rules.map((r) => ({
        ptype: r.ptype,
        v0: r.v0 || null,
        v1: r.v1 || null,
        v2: r.v2 || null,
        v3: r.v3 || null,
        v4: r.v4 || null,
        v5: r.v5 || null,
      }));
      const hasEdit = cleaned.some(
        (r) =>
          r.ptype === "p" &&
          r.v0 === "superadmin" &&
          r.v1 === "superadmin" &&
          r.v2 === "update",
      );
      if (!hasEdit) {
        const confirmed = window.confirm(
          "These changes will remove your ability to edit Casbin rules. Continue?",
        );
        if (!confirmed) return;
      }
      const res = await apiFetch("/api/casbin-rules", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cleaned),
      });
      if (res.ok) {
        const data = (await res.json()) as RuleInput[];
        const newPolicy = derivePolicyOptions(data);
        const newGroup = deriveGroupOptions(data);
        setPolicyOptions(newPolicy);
        setGroupOptions(newGroup);
        setRules(
          data.map((r) => ({
            ...normalizeRule(r, newPolicy, newGroup),
            id: crypto.randomUUID(),
          })),
        );
      }
    },
  });

  return {
    rules,
    updateRule,
    addRule,
    removeRule,
    saveRulesMutation,
    isSuperadmin,
    policyOptions,
    groupOptions,
  };
}
