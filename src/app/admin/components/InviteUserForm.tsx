"use client";
import { type FormEvent, useState } from "react";
import { useTranslation } from "react-i18next";
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

  return (
    <form onSubmit={onSubmit} className="mb-4 flex gap-2">
      <input
        type="email"
        value={inviteEmail}
        onChange={(e) => setInviteEmail(e.target.value)}
        className="border rounded p-1 bg-white dark:bg-gray-900"
      />
      <button
        type="submit"
        className="bg-blue-600 text-white px-2 py-1 rounded"
      >
        {t("admin.invite")}
      </button>
    </form>
  );
}
