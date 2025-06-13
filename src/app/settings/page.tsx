"use client";
import { useEffect, useState } from "react";

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
  const [mailProviders, setMailProviders] = useState<SnailMailProviderStatus[]>([]);

  useEffect(() => {
    fetch("/api/vin-sources")
      .then((res) => res.json())
      .then((data) => setSources(data));
    fetch("/api/snail-mail-providers")
      .then((res) => res.json())
      .then((data) => setMailProviders(data));
  }, []);

  async function toggle(id: string, enabled: boolean) {
    await fetch(`/api/vin-sources/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled }),
    });
    const res = await fetch("/api/vin-sources");
    if (res.ok) setSources(await res.json());
  }

  async function activateProvider(id: string) {
    await fetch(`/api/snail-mail-providers/${id}`, { method: "PUT" });
    const res = await fetch("/api/snail-mail-providers");
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
              <span className="px-2 py-1 bg-green-500 text-white rounded">Active</span>
            ) : (
              <button
                type="button"
                onClick={() => activateProvider(p.id)}
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
