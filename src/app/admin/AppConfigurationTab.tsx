"use client";
import { apiFetch } from "@/apiClient";
import { useSession } from "@/app/useSession";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

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

interface OauthProviderStatus {
  id: string;
  enabled: boolean;
}

const VIN_SOURCES_QUERY_KEY = ["/api/vin-sources"] as const;
const MAIL_PROVIDERS_QUERY_KEY = ["/api/snail-mail-providers"] as const;
const OAUTH_PROVIDERS_QUERY_KEY = ["/api/oauth-providers"] as const;

export default function AppConfigurationTab() {
  const queryClient = useQueryClient();
  const { data: sources = [] } = useQuery<VinSourceStatus[]>({
    queryKey: VIN_SOURCES_QUERY_KEY,
  });
  const { data: mailProviders = [] } = useQuery<SnailMailProviderStatus[]>({
    queryKey: MAIL_PROVIDERS_QUERY_KEY,
  });
  const { data: oauthProviders = [] } = useQuery<OauthProviderStatus[]>({
    queryKey: OAUTH_PROVIDERS_QUERY_KEY,
  });
  const { data: session } = useSession();
  const isAdmin =
    session?.user?.role === "admin" || session?.user?.role === "superadmin";
  const { t } = useTranslation();

  const toggleMutation = useMutation({
    async mutationFn({ id, enabled }: { id: string; enabled: boolean }) {
      await apiFetch(`/api/vin-sources/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });
    },
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: VIN_SOURCES_QUERY_KEY });
    },
  });

  const activateMutation = useMutation({
    async mutationFn(id: string) {
      await apiFetch(`/api/snail-mail-providers/${id}`, {
        method: "PUT",
      });
    },
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: MAIL_PROVIDERS_QUERY_KEY });
    },
  });

  const oauthToggleMutation = useMutation({
    async mutationFn({ id, enabled }: { id: string; enabled: boolean }) {
      await apiFetch(`/api/oauth-providers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });
    },
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: OAUTH_PROVIDERS_QUERY_KEY });
    },
  });

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">{t("vinLookupModules")}</h1>
      <ul className="grid gap-2">
        {sources.map((s) => (
          <li key={s.id} className="flex items-center gap-4">
            <span className="flex-1">
              {s.id} (failures: {s.failureCount})
            </span>
            <button
              type="button"
              onClick={() =>
                toggleMutation.mutate({ id: s.id, enabled: !s.enabled })
              }
              disabled={!isAdmin}
              className={
                s.enabled
                  ? "bg-green-500 text-white px-2 py-1 rounded"
                  : "bg-gray-300 dark:bg-gray-700 px-2 py-1 rounded"
              }
            >
              {s.enabled ? t("admin.disable") : t("enable")}
            </button>
          </li>
        ))}
      </ul>
      <h1 className="text-xl font-bold my-4">{t("snailMailProviders")}</h1>
      <ul className="grid gap-2">
        {mailProviders.map((p) => (
          <li key={p.id} className="flex items-center gap-4">
            <span className="flex-1">
              {p.id} (failures: {p.failureCount})
            </span>
            {p.active ? (
              <span className="px-2 py-1 bg-green-500 text-white rounded">
                {t("active")}
              </span>
            ) : (
              <button
                type="button"
                onClick={() => activateMutation.mutate(p.id)}
                disabled={!isAdmin}
                className="bg-gray-300 dark:bg-gray-700 px-2 py-1 rounded"
              >
                {t("activate")}
              </button>
            )}
          </li>
        ))}
      </ul>
      <h1 className="text-xl font-bold my-4">{t("oauthProviders")}</h1>
      <ul className="grid gap-2">
        {oauthProviders.map((p) => (
          <li key={p.id} className="flex items-center gap-4">
            <span className="flex-1">{p.id}</span>
            <button
              type="button"
              onClick={() =>
                oauthToggleMutation.mutate({ id: p.id, enabled: !p.enabled })
              }
              disabled={!isAdmin}
              className={
                p.enabled
                  ? "bg-green-500 text-white px-2 py-1 rounded"
                  : "bg-gray-300 dark:bg-gray-700 px-2 py-1 rounded"
              }
            >
              {p.enabled ? t("admin.disable") : t("enable")}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
