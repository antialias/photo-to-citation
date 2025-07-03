"use client";
import { useTranslation } from "react-i18next";
import type { UserRecord } from "../AdminPageClient";
import type { useUsers } from "../hooks/useUsers";

export default function UsersTable({
  hooks,
}: { hooks: ReturnType<typeof useUsers> }) {
  const { usersQuery, disable, changeRole, remove } = hooks;
  const users = usersQuery.data ?? [];
  const { t } = useTranslation();
  return (
    <ul className="grid gap-2">
      {users.map((u: UserRecord) => (
        <li key={u.id} className="flex items-center gap-2">
          <span className="flex-1">{u.email ?? u.id}</span>
          <select
            value={u.role}
            onChange={(e) =>
              changeRole.mutate({ id: u.id, role: e.target.value })
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
              onClick={() => disable.mutate(u.id)}
              className="bg-yellow-500 text-white px-2 py-1 rounded"
            >
              {t("admin.disable")}
            </button>
          )}
          <button
            type="button"
            onClick={() => remove.mutate(u.id)}
            className="bg-red-500 text-white px-2 py-1 rounded"
          >
            {t("admin.delete")}
          </button>
        </li>
      ))}
    </ul>
  );
}
