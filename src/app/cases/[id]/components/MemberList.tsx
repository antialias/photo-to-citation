"use client";
import { useCaseContext } from "../context/CaseContext";

export default function MemberList({
  readOnly = false,
}: { readOnly?: boolean }) {
  const {
    members,
    inviteUserId,
    setInviteUserId,
    removeMember,
    inviteMember,
    isAdmin,
    sessionUserId,
  } = useCaseContext();

  const isOwner = members.some(
    (m) => m.userId === sessionUserId && m.role === "owner",
  );
  const canManage = isAdmin || isOwner;

  return (
    <div>
      <span className="font-semibold">Members:</span>
      <ul className="ml-2 mt-1 flex flex-col gap-1">
        {members.map((m) => (
          <li key={m.userId} className="flex items-center gap-2">
            <span className="flex-1">
              {m.name ?? m.email ?? m.userId} ({m.role})
            </span>
            {readOnly || !canManage || m.role === "owner" ? null : (
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
      {readOnly || !canManage ? null : (
        <div className="flex gap-2 mt-2">
          <input
            type="text"
            value={inviteUserId}
            onChange={(e) => setInviteUserId(e.target.value)}
            placeholder="User ID"
            className="border rounded p-1 flex-1 bg-white dark:bg-gray-900"
          />
          <button
            type="button"
            onClick={inviteMember}
            className="bg-blue-600 text-white px-2 py-1 rounded"
          >
            Invite
          </button>
        </div>
      )}
    </div>
  );
}
