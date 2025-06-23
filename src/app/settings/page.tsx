"use client";
import { useSession } from "@/app/useSession";
import { useEffect, useState } from "react";

export default function UserSettingsPage() {
  const { data: session } = useSession();
  const [tab, setTab] = useState<"profile" | "credits">("profile");
  const [balance, setBalance] = useState<number | null>(null);
  const [usd, setUsd] = useState("0");

  useEffect(() => {
    if (tab === "credits") {
      fetch("/api/credits/balance")
        .then((res) => res.json())
        .then((data) => setBalance(data.balance));
    }
  }, [tab]);

  async function addCredits() {
    await fetch("/api/credits/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usd: Number(usd) }),
    });
    setUsd("0");
    const res = await fetch("/api/credits/balance");
    if (res.ok) {
      const data = await res.json();
      setBalance(data.balance);
    }
  }

  if (!session) {
    return <div className="p-8">You are not logged in.</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-xl font-bold mb-4">User Settings</h1>
      <div className="flex gap-4 mb-4">
        <button
          type="button"
          onClick={() => setTab("profile")}
          className="bg-gray-300 dark:bg-gray-700 px-2 py-1 rounded"
        >
          Profile
        </button>
        <button
          type="button"
          onClick={() => setTab("credits")}
          className="bg-gray-300 dark:bg-gray-700 px-2 py-1 rounded"
        >
          Credits
        </button>
      </div>
      {tab === "profile" && (
        <div>
          <p>Email: {session.user?.email ?? session.user?.name ?? "Unknown"}</p>
          <p>Role: {session.user?.role}</p>
        </div>
      )}
      {tab === "credits" && (
        <div className="grid gap-2 max-w-sm">
          <p>Balance: {balance ?? 0} credits</p>
          <div className="flex gap-2">
            <input
              type="number"
              value={usd}
              onChange={(e) => setUsd(e.target.value)}
              className="border p-1 flex-1"
            />
            <button
              type="button"
              onClick={addCredits}
              className="bg-blue-600 text-white px-2 py-1 rounded"
            >
              Add
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
