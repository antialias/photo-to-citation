"use client";
import { useSession } from "../useSession";

export default function UserSettingsPage() {
  const { data: session } = useSession();

  if (!session) {
    return <div className="p-8">You are not logged in.</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-xl font-bold mb-4">User Settings</h1>
      <p>Email: {session.user?.email ?? session.user?.name ?? "Unknown"}</p>
      <p>Role: {session.user?.role}</p>
    </div>
  );
}
