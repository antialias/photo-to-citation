"use client";
import { apiFetch } from "@/apiClient";
import { useSession } from "@/app/useSession";
import { useState } from "react";
import AppConfigurationTab from "./AppConfigurationTab";

export interface UserRecord {
  id: string;
  email: string | null;
  name: string | null;
  role: string;
}

export interface CasbinRule {
  ptype: string;
  v0?: string | null;
  v1?: string | null;
  v2?: string | null;
  v3?: string | null;
  v4?: string | null;
  v5?: string | null;
}

export default function AdminPageClient({
  initialUsers,
  initialRules,
}: {
  initialUsers: UserRecord[];
  initialRules: CasbinRule[];
}) {
  const [users, setUsers] = useState(initialUsers);
  const [rules, setRules] = useState(initialRules);
  const [tab, setTab] = useState<"users" | "config">("users");
  const [inviteEmail, setInviteEmail] = useState("");
  const { data: session } = useSession();
  const isSuperadmin = session?.user?.role === "superadmin";

  async function refreshUsers() {
    const res = await apiFetch("/api/users");
    if (res.ok) setUsers(await res.json());
  }

  async function invite() {
    await apiFetch("/api/users/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: inviteEmail }),
    });
    setInviteEmail("");
    refreshUsers();
  }

  async function disable(id: string) {
    await apiFetch(`/api/users/${id}/disable`, { method: "PUT" });
    refreshUsers();
  }

  async function changeRole(id: string, role: string) {
    await apiFetch(`/api/users/${id}/role`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    refreshUsers();
  }

  async function remove(id: string) {
    await apiFetch(`/api/users/${id}`, { method: "DELETE" });
    refreshUsers();
  }

  function updateRule(index: number, field: keyof CasbinRule, value: string) {
    setRules((curr) => {
      const next = [...curr];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  }

  function addRule() {
    setRules((curr) => [...curr, { ptype: "p", v0: "", v1: "", v2: "" }]);
  }

  function removeRule(index: number) {
    setRules((curr) => curr.filter((_, i) => i !== index));
  }

  async function saveRules() {
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
    const res = await apiFetch("/api/casbin-rules", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cleaned),
    });
    if (res.ok) setRules(await res.json());
  }

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
              onClick={invite}
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
                  onChange={(e) => changeRole(u.id, e.target.value)}
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
                    onClick={() => disable(u.id)}
                    className="bg-yellow-500 text-white px-2 py-1 rounded"
                  >
                    Disable
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => remove(u.id)}
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
              {rules.map((r, i) => (
                <tr
                  key={`${r.ptype}-${r.v0}-${r.v1}-${r.v2}-${r.v3}-${r.v4}-${r.v5}`}
                >
                  <td className="border">
                    <input
                      value={r.ptype}
                      onChange={(e) => updateRule(i, "ptype", e.target.value)}
                      className="w-full p-1 bg-white dark:bg-gray-900"
                    />
                  </td>
                  <td className="border">
                    <input
                      value={r.v0 ?? ""}
                      onChange={(e) => updateRule(i, "v0", e.target.value)}
                      className="w-full p-1 bg-white dark:bg-gray-900"
                    />
                  </td>
                  <td className="border">
                    <input
                      value={r.v1 ?? ""}
                      onChange={(e) => updateRule(i, "v1", e.target.value)}
                      className="w-full p-1 bg-white dark:bg-gray-900"
                    />
                  </td>
                  <td className="border">
                    <input
                      value={r.v2 ?? ""}
                      onChange={(e) => updateRule(i, "v2", e.target.value)}
                      className="w-full p-1 bg-white dark:bg-gray-900"
                    />
                  </td>
                  <td className="border">
                    <input
                      value={r.v3 ?? ""}
                      onChange={(e) => updateRule(i, "v3", e.target.value)}
                      className="w-full p-1 bg-white dark:bg-gray-900"
                    />
                  </td>
                  <td className="border">
                    <input
                      value={r.v4 ?? ""}
                      onChange={(e) => updateRule(i, "v4", e.target.value)}
                      className="w-full p-1 bg-white dark:bg-gray-900"
                    />
                  </td>
                  <td className="border">
                    <input
                      value={r.v5 ?? ""}
                      onChange={(e) => updateRule(i, "v5", e.target.value)}
                      className="w-full p-1 bg-white dark:bg-gray-900"
                    />
                  </td>
                  <td className="border">
                    <button
                      type="button"
                      onClick={() => removeRule(i)}
                      className="bg-red-500 text-white px-2 py-1 rounded"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
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
            onClick={saveRules}
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
