"use client";
import { apiFetch, queryFn } from "@/apiClient";
import { useSession } from "@/app/useSession";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

export default function UserSettingsPage() {
  const { data: session } = useSession();
  const [tab, setTab] = useState<"profile" | "credits">("profile");
  const [balance, setBalance] = useState<number | null>(null);
  const [usd, setUsd] = useState("0");
  const queryClient = useQueryClient();
  useQuery({
    queryKey: ["credits"],
    queryFn: queryFn<{ balance: number }>("/api/credits/balance"),
    enabled: tab === "credits",
    onSuccess: (data) => setBalance(data.balance),
  });

  const addMutation = useMutation({
    mutationFn: (usdAmount: number) =>
      apiFetch("/api/credits/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usd: usdAmount }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["credits"] }),
  });

  function addCredits() {
    addMutation.mutate(Number(usd));
    setUsd("0");
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
          className={`px-2 py-1 rounded ${
            tab === "profile"
              ? "bg-blue-600 text-white"
              : "bg-gray-300 dark:bg-gray-700"
          }`}
        >
          Profile
        </button>
        <button
          type="button"
          onClick={() => setTab("credits")}
          className={`px-2 py-1 rounded ${
            tab === "credits"
              ? "bg-blue-600 text-white"
              : "bg-gray-300 dark:bg-gray-700"
          }`}
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
