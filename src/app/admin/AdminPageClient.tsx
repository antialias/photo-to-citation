"use client";
import { apiFetch } from "@/apiClient";
import { useSession } from "@/app/useSession";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNotify } from "../components/NotificationProvider";
import AppConfigurationTab from "./AppConfigurationTab";

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

export interface UserRecord {
  id: string;
  email: string | null;
  name: string | null;
  role: string;
}

export interface CasbinRule {
  id: string;
  ptype: string;
  v0?: string | null;
  v1?: string | null;
  v2?: string | null;
  v3?: string | null;
  v4?: string | null;
  v5?: string | null;
}

export type RuleInput = Omit<CasbinRule, "id">;

export default function AdminPageClient({
  initialUsers,
  initialRules,
}: {
  initialUsers: UserRecord[];
  initialRules: RuleInput[];
}) {
  const queryClient = useQueryClient();
  const { data: users = [] } = useQuery<UserRecord[]>({
    queryKey: ["users"],
    initialData: initialUsers,
    queryFn: async () => {
      const res = await apiFetch("/api/users");
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
  });
  const [rules, setRules] = useState(() =>
    initialRules.map((r) => ({ ...normalizeRule(r), id: crypto.randomUUID() })),
  );
  const [tab, setTab] = useState<"users" | "config">("users");
  const [inviteEmail, setInviteEmail] = useState("");
  const { data: session } = useSession();
  const isSuperadmin = session?.user?.role === "superadmin";

  const inviteMutation = useMutation({
    mutationFn: async () => {
      await apiFetch("/api/users/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail }),
      });
    },
    onSuccess: () => {
      setInviteEmail("");
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const disableMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiFetch(`/api/users/${id}/disable`, { method: "PUT" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const changeRoleMutation = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: string }) => {
      await apiFetch(`/api/users/${id}/role`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiFetch(`/api/users/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const notify = useNotify();

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
    mutationFn: async () => {
      if (!isSuperadmin) return null;
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
        if (!confirmed) return null;
      }
      const res = await apiFetch("/api/casbin-rules", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cleaned),
      });
      if (!res.ok) throw new Error("Failed to save rules");
      return res.json();
    },
    onSuccess: (data: RuleInput[] | null) => {
      if (!data) return;
      setRules(
        data.map((r) => ({
          ...r,
          id: crypto.randomUUID(),
        })),
      );
    },
  });

  return (
    <div className="p-8">
      <div className="flex gap-4 mb-4">
        <button
          type="button"
          onClick={() => setTab("users")}
          className={tab === "users" ? "font-bold underline" : ""}
        >
          User Management
        </button>
        <button
          type="button"
          onClick={() => setTab("config")}
          className={tab === "config" ? "font-bold underline" : ""}
        >
          App Configuration
        </button>
      </div>
      {tab === "users" && (
        <>
          <h1 className="text-xl font-bold mb-4">Users</h1>
          <div className="mb-4 flex gap-2">
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="border rounded p-1 bg-white dark:bg-gray-900"
            />
            <button
              type="button"
              onClick={() => inviteMutation.mutate()}
              className="bg-blue-600 text-white px-2 py-1 rounded"
            >
              Invite
            </button>
          </div>
          <ul className="grid gap-2">
            {users.map((u) => (
              <li key={u.id} className="flex items-center gap-2">
                <span className="flex-1">{u.email ?? u.id}</span>
                <select
                  value={u.role}
                  onChange={(e) =>
                    changeRoleMutation.mutate({
                      id: u.id,
                      role: e.target.value,
                    })
                  }
                  className="border rounded p-1 bg-white dark:bg-gray-900"
                >
                  <option value="user">user</option>
                  <option value="admin">admin</option>
                  <option value="superadmin">superadmin</option>
                  <option value="disabled">disabled</option>
                </select>
                {u.role !== "disabled" && (
                  <button
                    type="button"
                    onClick={() => disableMutation.mutate(u.id)}
                    className="bg-yellow-500 text-white px-2 py-1 rounded"
                  >
                    Disable
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => removeMutation.mutate(u.id)}
                  className="bg-red-500 text-white px-2 py-1 rounded"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
          <h1 className="text-xl font-bold my-4">Casbin Rules</h1>
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
              {rules.map((r) => {
                const ptypeOptions = ["p", "g"];
                const v0Options =
                  r.ptype === "p"
                    ? Object.keys(policyOptions)
                    : Object.keys(groupOptions);
                const v1Options =
                  r.ptype === "p"
                    ? r.v0
                      ? Object.keys(
                          policyOptions[r.v0 as keyof typeof policyOptions] ??
                            {},
                        )
                      : []
                    : r.v0
                      ? (groupOptions[r.v0 as keyof typeof groupOptions] ?? [])
                      : [];
                const v2Options =
                  r.ptype === "p" && r.v0 && r.v1
                    ? (policyOptions[r.v0 as keyof typeof policyOptions][
                        r.v1 as keyof (typeof policyOptions)[keyof typeof policyOptions]
                      ] ?? [])
                    : [];
                return (
                  <tr key={r.id}>
                    <td className="border">
                      <select
                        value={r.ptype}
                        onChange={(e) =>
                          updateRule(r.id, "ptype", e.target.value)
                        }
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
                        value={r.v0 ?? ""}
                        onChange={(e) => updateRule(r.id, "v0", e.target.value)}
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
                        value={r.v1 ?? ""}
                        onChange={(e) => updateRule(r.id, "v1", e.target.value)}
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
                        value={r.v2 ?? ""}
                        onChange={(e) => updateRule(r.id, "v2", e.target.value)}
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
                        value={r.v3 ?? ""}
                        onChange={(e) => updateRule(r.id, "v3", e.target.value)}
                        className="w-full p-1 bg-white dark:bg-gray-900"
                      />
                    </td>
                    <td className="border">
                      <input
                        value={r.v4 ?? ""}
                        onChange={(e) => updateRule(r.id, "v4", e.target.value)}
                        className="w-full p-1 bg-white dark:bg-gray-900"
                      />
                    </td>
                    <td className="border">
                      <input
                        value={r.v5 ?? ""}
                        onChange={(e) => updateRule(r.id, "v5", e.target.value)}
                        className="w-full p-1 bg-white dark:bg-gray-900"
                      />
                    </td>
                    <td className="border">
                      <button
                        type="button"
                        onClick={() => removeRule(r.id)}
                        className="bg-red-500 text-white px-2 py-1 rounded"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="flex gap-2 mb-2">
            <button
              type="button"
              onClick={addRule}
              className="bg-green-600 text-white px-2 py-1 rounded"
            >
              Add Rule
            </button>
          </div>
          <button
            type="button"
            onClick={() => saveRulesMutation.mutate()}
            disabled={!isSuperadmin}
            className="bg-blue-600 text-white px-2 py-1 rounded disabled:opacity-50"
          >
            Save Rules
          </button>
        </>
      )}
      {tab === "config" && <AppConfigurationTab />}
    </div>
  );
}
