"use client";
import { useTranslation } from "react-i18next";
import { css } from "styled-system/css";
import { button } from "styled-system/recipes";
import { token } from "styled-system/tokens";
import type { UserRecord } from "../AdminPageClient";
import type { useUsers } from "../hooks/useUsers";

export default function UsersTable({
  hooks,
}: { hooks: ReturnType<typeof useUsers> }) {
  const { usersQuery, disable, changeRole, remove } = hooks;
  const users = usersQuery.data ?? [];
  const { t } = useTranslation();
  const styles = {
    list: css({ display: "grid", gap: "2" }),
    item: css({ display: "flex", alignItems: "center", gap: "2" }),
    email: css({ flex: "1" }),
    select: css({
      borderWidth: "1px",
      borderRadius: token("radii.md"),
      p: "1",
      backgroundColor: { base: "white", _dark: token("colors.gray.900") },
    }),
    disableBtn: button({ variant: "warning" }),
    deleteBtn: button({ variant: "danger" }),
  };

  return (
    <ul className={styles.list}>
      {users.map((u: UserRecord) => (
        <li key={u.id} className={styles.item}>
          <span className={styles.email}>{u.email ?? u.id}</span>
          <select
            value={u.role}
            onChange={(e) =>
              changeRole.mutate({ id: u.id, role: e.target.value })
            }
            className={styles.select}
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
              className={styles.disableBtn}
            >
              {t("admin.disable")}
            </button>
          )}
          <button
            type="button"
            onClick={() => remove.mutate(u.id)}
            className={styles.deleteBtn}
          >
            {t("admin.delete")}
          </button>
        </li>
      ))}
    </ul>
  );
}
