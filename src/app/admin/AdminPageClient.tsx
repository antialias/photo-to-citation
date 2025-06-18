"use client";
import { apiFetch } from "@/apiClient";
import { useEffect, useState } from "react";
import { useSession } from "../useSession";
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
  const [rulesText, setRulesText] = useState(
    JSON.stringify(initialRules, null, 2),
  );
  const { data: session } = useSession();
  const isSuperadmin = session?.user?.role === "superadmin";

  useEffect(() => {
    setRulesText(JSON.stringify(rules, null, 2));
  }, [rules]);

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

  async function saveRules() {
    if (!isSuperadmin) return;
    try {
      const parsed = JSON.parse(rulesText) as CasbinRule[];
      const res = await apiFetch("/api/casbin-rules", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      });
      if (res.ok) setRules(await res.json());
    } catch {
      alert("Invalid rules JSON");
    }
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
          <ul className="grid gap-1">
            {rules.map((r) => (
              <li key={`${r.ptype}-${r.v0}-${r.v1}-${r.v2}`}>
                {r.ptype}, {r.v0 ?? ""}, {r.v1 ?? ""}, {r.v2 ?? ""}
              </li>
            ))}
          </ul>
          <textarea
            value={rulesText}
            onChange={(e) => setRulesText(e.target.value)}
            rows={10}
            className="border p-1 w-full my-2 bg-white dark:bg-gray-900"
          />
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
