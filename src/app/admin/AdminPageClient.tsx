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
    const updated = [...rules];
    updated[index] = { ...updated[index], [field]: value };
    setRules(updated);
  }

  function addRule() {
    setRules([...rules, { ptype: "p", v0: "", v1: "", v2: "" }]);
  }

  function removeRule(index: number) {
    setRules(rules.filter((_, i) => i !== index));
  }

  async function saveRules() {
    if (!isSuperadmin) return;
    const res = await apiFetch("/api/casbin-rules", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(rules),
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
          <table className="w-full mb-2">
            <thead>
              <tr className="text-left">
                <th>ptype</th>
                <th>v0</th>
                <th>v1</th>
                <th>v2</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rules.map((r, i) => (
                <tr key={`${i}-${r.ptype}-${r.v0}-${r.v1}-${r.v2}`}>
                  <td>
                    <input
                      value={r.ptype}
                      onChange={(e) => updateRule(i, "ptype", e.target.value)}
                      className="border p-1 bg-white dark:bg-gray-900"
                    />
                  </td>
                  <td>
                    <input
                      value={r.v0 ?? ""}
                      onChange={(e) => updateRule(i, "v0", e.target.value)}
                      className="border p-1 bg-white dark:bg-gray-900"
                    />
                  </td>
                  <td>
                    <input
                      value={r.v1 ?? ""}
                      onChange={(e) => updateRule(i, "v1", e.target.value)}
                      className="border p-1 bg-white dark:bg-gray-900"
                    />
                  </td>
                  <td>
                    <input
                      value={r.v2 ?? ""}
                      onChange={(e) => updateRule(i, "v2", e.target.value)}
                      className="border p-1 bg-white dark:bg-gray-900"
                    />
                  </td>
                  <td>
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
          <button
            type="button"
            onClick={addRule}
            className="bg-green-600 text-white px-2 py-1 rounded mb-2"
          >
            Add Rule
          </button>
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
