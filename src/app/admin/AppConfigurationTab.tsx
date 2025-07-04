"use client";
import { apiFetch } from "@/apiClient";
import { useSession } from "@/app/useSession";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNotify } from "../components/NotificationProvider";

interface VinSourceStatus {
  id: string;
  enabled: boolean;
  failureCount: number;
}

interface SnailMailProviderStatus {
  id: string;
  active: boolean;
  failureCount: number;
  ready?: boolean;
  message?: string;
  testable?: boolean;
}

interface OauthProviderStatus {
  id: string;
  enabled: boolean;
}

interface OwnershipModuleStatus {
  id: string;
  state: string;
  enabled: boolean;
  failureCount: number;
}

const VIN_SOURCES_QUERY_KEY = ["/api/vin-sources"] as const;
const MAIL_PROVIDERS_QUERY_KEY = ["/api/snail-mail-providers"] as const;
const OAUTH_PROVIDERS_QUERY_KEY = ["/api/oauth-providers"] as const;
const OWNERSHIP_MODULES_QUERY_KEY = ["/api/ownership-modules"] as const;
const MOCK_EMAIL_QUERY_KEY = ["/api/mock-email"] as const;

export default function AppConfigurationTab() {
  const queryClient = useQueryClient();
  const { data: sources = [] } = useQuery<VinSourceStatus[]>({
    queryKey: VIN_SOURCES_QUERY_KEY,
  });
  const { data: mailProviders = [] } = useQuery<SnailMailProviderStatus[]>({
    queryKey: MAIL_PROVIDERS_QUERY_KEY,
  });
  const { data: ownershipModules = [] } = useQuery<OwnershipModuleStatus[]>({
    queryKey: OWNERSHIP_MODULES_QUERY_KEY,
  });
  const { data: oauthProviders = [] } = useQuery<OauthProviderStatus[]>({
    queryKey: OAUTH_PROVIDERS_QUERY_KEY,
  });
  const { data: mockEmail } = useQuery<{
    to: string;
    envOverride: boolean;
    settingsTo: string;
  }>({
    queryKey: MOCK_EMAIL_QUERY_KEY,
  });
  const { data: session } = useSession();
  const isAdmin =
    session?.user?.role === "admin" || session?.user?.role === "superadmin";
  const { t } = useTranslation();
  const notify = useNotify();
  const [mockTo, setMockTo] = useState("");

  useEffect(() => {
    if (mockEmail) setMockTo(mockEmail.settingsTo);
  }, [mockEmail]);

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

  const testMutation = useMutation({
    async mutationFn(id: string) {
      const res = await apiFetch(`/api/snail-mail-providers/${id}/test`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("test failed");
      return (await res.json()) as { success: boolean; message?: string };
    },
    onSuccess(data) {
      notify(
        data.success ? t("testSucceeded") : data.message || t("testFailed"),
      );
    },
    onError() {
      notify(t("testFailed"));
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

  const ownershipToggleMutation = useMutation({
    async mutationFn({ id, enabled }: { id: string; enabled: boolean }) {
      await apiFetch(`/api/ownership-modules/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });
    },
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: OWNERSHIP_MODULES_QUERY_KEY });
    },
  });

  const mockEmailMutation = useMutation({
    async mutationFn(to: string) {
      await apiFetch("/api/mock-email", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to }),
      });
    },
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: MOCK_EMAIL_QUERY_KEY });
    },
  });

  return (
    <Tabs orientation="vertical" className="flex gap-4" defaultValue="vin">
      <TabsList className="flex flex-col w-48 shrink-0 border-r border-b-0 mr-4">
        <TabsTrigger className="justify-start" value="vin">
          {t("vinLookupModules")}
        </TabsTrigger>
        <TabsTrigger className="justify-start" value="mail">
          {t("snailMailProviders")}
        </TabsTrigger>
        <TabsTrigger className="justify-start" value="ownership">
          {t("ownershipModules")}
        </TabsTrigger>
        <TabsTrigger className="justify-start" value="oauth">
          {t("oauthProviders")}
        </TabsTrigger>
        <TabsTrigger className="justify-start" value="mock">
          {t("mockEmailRecipient")}
        </TabsTrigger>
      </TabsList>
      <div className="flex-1">
        <TabsContent value="vin">
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
        </TabsContent>
        <TabsContent value="mail">
          <h1 className="text-xl font-bold mb-4">{t("snailMailProviders")}</h1>
          <ul className="grid gap-2">
            {mailProviders.map((p) => (
              <li key={p.id} className="flex items-center gap-4">
                <span className="flex-1">
                  {p.id} (failures: {p.failureCount})
                </span>
                <span className="flex items-center gap-1">
                  <span
                    className={p.ready ? "text-green-600" : "text-yellow-600"}
                  >
                    ●
                  </span>
                  {p.ready ? t("ready") : t("notReady")}
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
                {p.testable && (
                  <button
                    type="button"
                    onClick={() => testMutation.mutate(p.id)}
                    disabled={!isAdmin}
                    className="bg-blue-600 text-white px-2 py-1 rounded"
                  >
                    {t("test")}
                  </button>
                )}
                {!p.ready && p.message && (
                  <span className="text-sm text-yellow-600">{p.message}</span>
                )}
              </li>
            ))}
          </ul>
        </TabsContent>
        <TabsContent value="ownership">
          <h1 className="text-xl font-bold mb-4">{t("ownershipModules")}</h1>
          {(() => {
            const grouped = ownershipModules.reduce<
              Record<string, OwnershipModuleStatus[]>
            >((acc, mod) => {
              const arr = acc[mod.state] ?? [];
              arr.push(mod);
              acc[mod.state] = arr;
              return acc;
            }, {});
            return Object.entries(grouped).map(([state, mods]) => (
              <div key={state} className="mb-2">
                <h2 className="font-semibold">{state}</h2>
                <ul className="grid gap-2">
                  {mods.map((m) => (
                    <li key={m.id} className="flex items-center gap-4">
                      <span className="flex-1">
                        {m.id} (failures: {m.failureCount})
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          ownershipToggleMutation.mutate({
                            id: m.id,
                            enabled: !m.enabled,
                          })
                        }
                        disabled={!isAdmin}
                        className={
                          m.enabled
                            ? "bg-green-500 text-white px-2 py-1 rounded"
                            : "bg-gray-300 dark:bg-gray-700 px-2 py-1 rounded"
                        }
                      >
                        {m.enabled ? t("admin.disable") : t("enable")}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ));
          })()}
        </TabsContent>
        <TabsContent value="oauth">
          <h1 className="text-xl font-bold mb-4">{t("oauthProviders")}</h1>
          <ul className="grid gap-2">
            {oauthProviders.map((p) => (
              <li key={p.id} className="flex items-center gap-4">
                <span className="flex-1">{p.id}</span>
                <button
                  type="button"
                  onClick={() =>
                    oauthToggleMutation.mutate({
                      id: p.id,
                      enabled: !p.enabled,
                    })
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
        </TabsContent>
        <TabsContent value="mock">
          <h1 className="text-xl font-bold mb-4">{t("mockEmailRecipient")}</h1>
          <div className="flex items-center gap-2 mb-2">
            <input
              type="email"
              value={mockTo}
              onChange={(e) => setMockTo(e.target.value)}
              placeholder={t("mockEmailRecipientPlaceholder")}
              className="flex-1 border rounded p-1 bg-white dark:bg-gray-900"
              disabled={!isAdmin}
            />
            <button
              type="button"
              onClick={() => mockEmailMutation.mutate(mockTo)}
              disabled={!isAdmin}
              className="bg-blue-600 text-white px-2 py-1 rounded"
            >
              {t("save")}
            </button>
          </div>
          {mockEmail?.envOverride && (
            <p className="text-sm text-red-600">{t("envVarOverrides")}</p>
          )}
        </TabsContent>
      </div>
    </Tabs>
  );
}
