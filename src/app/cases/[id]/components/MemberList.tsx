"use client";
import { useSession } from "@/app/useSession";
import { useState } from "react";
import { css, cx } from "styled-system/css";
import { token } from "styled-system/tokens";
import { useCaseContext } from "../CaseContext";

export type Member = {
  userId: string;
  role: string;
  name: string | null;
  email: string | null;
};

export default function MemberList({
  readOnly = false,
}: { readOnly?: boolean }) {
  const { members, inviteMember, removeMember } = useCaseContext();
  const [inviteUserId, setInviteUserId] = useState("");
  const { data: session } = useSession();
  const isOwner = members.some(
    (m) => m.userId === session?.user?.id && m.role === "owner",
  );
  const isAdmin =
    session?.user?.role === "admin" || session?.user?.role === "superadmin";
  const canManageMembers = isAdmin || isOwner;
  return (
    <div>
      <span className="font-semibold">Members:</span>
      <ul className="ml-2 mt-1 flex flex-col gap-1">
        {members.map((m) => (
          <li key={m.userId} className="flex items-center gap-2">
            <span className="flex-1">
              {m.name ?? m.email ?? m.userId} ({m.role})
            </span>
            {readOnly || !canManageMembers || m.role === "owner" ? null : (
              <button
                type="button"
                onClick={() => removeMember(m.userId)}
                className="text-red-600"
              >
                Remove
              </button>
            )}
          </li>
        ))}
      </ul>
      {readOnly || !canManageMembers ? null : (
        <div className="flex gap-2 mt-2">
          <input
            type="text"
            value={inviteUserId}
            onChange={(e) => setInviteUserId(e.target.value)}
            placeholder="User ID"
            className={cx(
              "border rounded p-1 flex-1",
              css({ bg: token("colors.surface") }),
            )}
          />
          <button
            type="button"
            onClick={() => {
              inviteMember(inviteUserId);
              setInviteUserId("");
            }}
            className="bg-blue-600 text-white px-2 py-1 rounded"
          >
            Invite
          </button>
        </div>
      )}
    </div>
  );
}
