"use client";
import { apiFetch } from "@/apiClient";
import { useEffect, useState } from "react";
import { useSession } from "../useSession";

interface VinSourceStatus {
  id: string;
  enabled: boolean;
  failureCount: number;
}

interface SnailMailProviderStatus {
  id: string;
  active: boolean;
  failureCount: number;
}

export default function SettingsPage() {
  const [sources, setSources] = useState<VinSourceStatus[]>([]);
  const [mailProviders, setMailProviders] = useState<SnailMailProviderStatus[]>(
    [],
  );
  const { data: session } = useSession();
  const isAdmin =
    session?.user?.role === "admin" || session?.user?.role === "superadmin";

  useEffect(() => {
    apiFetch("/api/vin-sources")
      .then((res) => res.json())
      .then((data) => setSources(data));
    apiFetch("/api/snail-mail-providers")
      .then((res) => res.json())
      .then((data) => setMailProviders(data));
  }, []);

  async function toggle(id: string, enabled: boolean) {
    await apiFetch(`/api/vin-sources/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled }),
    });
    const res = await apiFetch("/api/vin-sources");
    if (res.ok) setSources(await res.json());
  }

  async function activateProvider(id: string) {
    await apiFetch(`/api/snail-mail-providers/${id}`, {
      method: "PUT",
    });
    const res = await apiFetch("/api/snail-mail-providers");
    if (res.ok) setMailProviders(await res.json());
  }

  return (
    <div className="p-8">
      <h1 className="text-xl font-bold mb-4">VIN Lookup Modules</h1>
      <ul className="grid gap-2">
        {sources.map((s) => (
          <li key={s.id} className="flex items-center gap-4">
            <span className="flex-1">
              {s.id} (failures: {s.failureCount})
            </span>
            <button
              type="button"
              onClick={() => toggle(s.id, !s.enabled)}
              disabled={!isAdmin}
              className={
                s.enabled
                  ? "bg-green-500 text-white px-2 py-1 rounded"
                  : "bg-gray-300 dark:bg-gray-700 px-2 py-1 rounded"
              }
            >
              {s.enabled ? "Disable" : "Enable"}
            </button>
          </li>
        ))}
      </ul>
      <h1 className="text-xl font-bold my-4">Snail Mail Providers</h1>
      <ul className="grid gap-2">
        {mailProviders.map((p) => (
          <li key={p.id} className="flex items-center gap-4">
            <span className="flex-1">
              {p.id} (failures: {p.failureCount})
            </span>
            {p.active ? (
              <span className="px-2 py-1 bg-green-500 text-white rounded">
                Active
              </span>
            ) : (
              <button
                type="button"
                onClick={() => activateProvider(p.id)}
                disabled={!isAdmin}
                className="bg-gray-300 dark:bg-gray-700 px-2 py-1 rounded"
              >
                Activate
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
