import { apiFetch } from "@/apiClient";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import type { CasbinRule, RuleInput } from "../AdminPageClient";

const policyOptions = {
  anonymous: { public_cases: ["read"] },
  user: {
    upload: ["create"],
    cases: ["read", "update", "delete"],
    snail_mail_providers: ["read"],
    vin_sources: ["read"],
  },
  admin: {
    admin: ["read", "update"],
    users: ["create", "read", "update", "delete"],
    cases: ["update", "delete"],
    snail_mail_providers: ["update"],
    vin_sources: ["update"],
  },
  superadmin: { superadmin: ["read", "update"] },
} as const;

const groupOptions = {
  admin: ["user"],
  superadmin: ["admin"],
} as const;

function normalizeRule(rule: RuleInput): RuleInput {
  if (rule.ptype === "p") {
    const v0s = Object.keys(policyOptions) as Array<keyof typeof policyOptions>;
    if (!rule.v0 || !v0s.includes(rule.v0 as keyof typeof policyOptions))
      rule.v0 = v0s[0];
    const v1s = Object.keys(
      policyOptions[rule.v0 as keyof typeof policyOptions],
    ) as Array<keyof (typeof policyOptions)[keyof typeof policyOptions]>;
    if (
      !rule.v1 ||
      !v1s.includes(
        rule.v1 as keyof (typeof policyOptions)[keyof typeof policyOptions],
      )
    )
      rule.v1 = v1s[0];
    const v2s = policyOptions[rule.v0 as keyof typeof policyOptions][
      rule.v1 as keyof (typeof policyOptions)[keyof typeof policyOptions]
    ] as readonly string[];
    if (!rule.v2 || !v2s.includes(rule.v2)) rule.v2 = v2s[0];
  } else {
    const v0s = Object.keys(groupOptions) as Array<keyof typeof groupOptions>;
    if (!rule.v0 || !v0s.includes(rule.v0 as keyof typeof groupOptions))
      rule.v0 = v0s[0];
    const v1s = groupOptions[
      rule.v0 as keyof typeof groupOptions
    ] as readonly string[];
    if (!rule.v1 || !v1s.includes(rule.v1)) rule.v1 = v1s[0];
    rule.v2 = null;
  }
  return rule;
}

export function useCasbinRules(
  initialRules: RuleInput[],
  isSuperadmin: boolean,
) {
  const [rules, setRules] = useState(() =>
    initialRules.map((r) => ({ ...normalizeRule(r), id: crypto.randomUUID() })),
  );

  function updateRule(
    id: string,
    field: keyof Omit<CasbinRule, "id">,
    value: string,
  ) {
    setRules((curr) =>
      curr.map((r) =>
        r.id === id
          ? { ...normalizeRule({ ...r, [field]: value }), id: r.id }
          : r,
      ),
    );
  }

  function addRule() {
    const base = normalizeRule({ ptype: "p" });
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
      if (res.ok)
        setRules(
          (await res.json()).map((r: RuleInput) => ({
            ...r,
            id: crypto.randomUUID(),
          })),
        );
    },
  });

  return {
    rules,
    updateRule,
    addRule,
    removeRule,
    saveRulesMutation,
    isSuperadmin,
  };
}

export { policyOptions, groupOptions };
