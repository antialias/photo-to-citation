"use client";
import { type FormEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import { css } from "styled-system/css";
import { button } from "styled-system/recipes";
import { token } from "styled-system/tokens";
import type { useUsers } from "../hooks/useUsers";

export default function InviteUserForm({
  hooks,
}: { hooks: ReturnType<typeof useUsers> }) {
  const { invite } = hooks;
  const [inviteEmail, setInviteEmail] = useState("");
  const { t } = useTranslation();

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    invite.mutate(inviteEmail);
    setInviteEmail("");
  }

  const styles = {
    form: css({ mb: "4", display: "flex", gap: "2" }),
    input: css({
      borderWidth: "1px",
      borderRadius: token("radii.md"),
      p: "1",
      backgroundColor: { base: "white", _dark: token("colors.gray.900") },
    }),
    button: button({ variant: "primary" }),
  };

  return (
    <form onSubmit={onSubmit} className={styles.form}>
      <input
        type="email"
        value={inviteEmail}
        onChange={(e) => setInviteEmail(e.target.value)}
        className={styles.input}
      />
      <button type="submit" className={styles.button}>
        {t("admin.invite")}
      </button>
    </form>
  );
}
