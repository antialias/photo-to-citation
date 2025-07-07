"use client";
import { apiFetch } from "@/apiClient";
import { useSession } from "@/app/useSession";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { space } from "@/styleTokens";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { css } from "styled-system/css";
import { token } from "styled-system/tokens";
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

  const styles = {
    tabs: css({ display: "flex", gap: space.gap }),
    tabsList: css({
      display: "flex",
      flexDirection: "column",
      width: "48",
      flexShrink: 0,
      borderRightWidth: "1px",
      borderBottomWidth: 0,
      mr: "4",
    }),
    tabTrigger: css({ justifyContent: "flex-start" }),
    content: css({ flex: "1" }),
    heading: css({
      fontSize: token("fontSizes.xl"),
      fontWeight: "700",
      mb: "4",
    }),
    list: css({ display: "grid", gap: "2" }),
    item: css({ display: "flex", alignItems: "center", gap: space.gap }),
    flex1: css({ flex: "1" }),
    toggleOn: css({
      bg: "green.500",
      color: "white",
      px: "2",
      py: "1",
      borderRadius: token("radii.md"),
    }),
    toggleOff: css({
      bg: "gray.300",
      _dark: { bg: "gray.700" },
      px: "2",
      py: "1",
      borderRadius: token("radii.md"),
    }),
    statusWrap: css({ display: "flex", alignItems: "center", gap: "1" }),
    readyDot: css({ color: "green.600" }),
    notReadyDot: css({ color: "yellow.600" }),
    activeBadge: css({
      px: "2",
      py: "1",
      bg: "green.500",
      color: "white",
      borderRadius: token("radii.md"),
    }),
    testBtn: css({
      bg: "blue.600",
      color: "white",
      px: "2",
      py: "1",
      borderRadius: token("radii.md"),
    }),
    message: css({ fontSize: "sm", color: "yellow.600" }),
    state: css({ mb: "2" }),
    stateHeading: css({ fontWeight: "600" }),
    input: css({
      flex: "1",
      borderWidth: "1px",
      borderRadius: token("radii.md"),
      p: "1",
      backgroundColor: { base: "white", _dark: token("colors.gray.900") },
    }),
    saveBtn: css({
      bg: "blue.600",
      color: "white",
      px: "2",
      py: "1",
      borderRadius: token("radii.md"),
    }),
    envVar: css({ fontSize: "sm", color: "red.600" }),
    inputRow: css({ display: "flex", alignItems: "center", gap: "2", mb: "2" }),
  };

  return (
    <Tabs orientation="vertical" className={styles.tabs} defaultValue="vin">
      <TabsList className={styles.tabsList}>
        <TabsTrigger className={styles.tabTrigger} value="vin">
          {t("vinLookupModules")}
        </TabsTrigger>
        <TabsTrigger className={styles.tabTrigger} value="mail">
          {t("snailMailProviders")}
        </TabsTrigger>
        <TabsTrigger className={styles.tabTrigger} value="ownership">
          {t("ownershipModules")}
        </TabsTrigger>
        <TabsTrigger className={styles.tabTrigger} value="oauth">
          {t("oauthProviders")}
        </TabsTrigger>
        <TabsTrigger className={styles.tabTrigger} value="mock">
          {t("mockEmailRecipient")}
        </TabsTrigger>
      </TabsList>
      <div className={styles.content}>
        <TabsContent value="vin">
          <h1 className={styles.heading}>{t("vinLookupModules")}</h1>
          <ul className={styles.list}>
            {sources.map((s) => (
              <li key={s.id} className={styles.item}>
                <span className={styles.flex1}>
                  {s.id} (failures: {s.failureCount})
                </span>
                <button
                  type="button"
                  onClick={() =>
                    toggleMutation.mutate({ id: s.id, enabled: !s.enabled })
                  }
                  disabled={!isAdmin}
                  className={s.enabled ? styles.toggleOn : styles.toggleOff}
                >
                  {s.enabled ? t("admin.disable") : t("enable")}
                </button>
              </li>
            ))}
          </ul>
        </TabsContent>
        <TabsContent value="mail">
          <h1 className={styles.heading}>{t("snailMailProviders")}</h1>
          <ul className={styles.list}>
            {mailProviders.map((p) => (
              <li key={p.id} className={styles.item}>
                <span className={styles.flex1}>
                  {p.id} (failures: {p.failureCount})
                </span>
                <span className={styles.statusWrap}>
                  <span
                    className={p.ready ? styles.readyDot : styles.notReadyDot}
                  >
                    ●
                  </span>
                  {p.ready ? t("ready") : t("notReady")}
                </span>
                {p.active ? (
                  <span className={styles.activeBadge}>{t("active")}</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => activateMutation.mutate(p.id)}
                    disabled={!isAdmin}
                    className={styles.toggleOff}
                  >
                    {t("activate")}
                  </button>
                )}
                {p.testable && (
                  <button
                    type="button"
                    onClick={() => testMutation.mutate(p.id)}
                    disabled={!isAdmin}
                    className={styles.testBtn}
                  >
                    {t("test")}
                  </button>
                )}
                {!p.ready && p.message && (
                  <span className={styles.message}>{p.message}</span>
                )}
              </li>
            ))}
          </ul>
        </TabsContent>
        <TabsContent value="ownership">
          <h1 className={styles.heading}>{t("ownershipModules")}</h1>
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
              <div key={state} className={styles.state}>
                <h2 className={styles.stateHeading}>{state}</h2>
                <ul className={styles.list}>
                  {mods.map((m) => (
                    <li key={m.id} className={styles.item}>
                      <span className={styles.flex1}>
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
                          m.enabled ? styles.toggleOn : styles.toggleOff
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
          <h1 className={styles.heading}>{t("oauthProviders")}</h1>
          <ul className={styles.list}>
            {oauthProviders.map((p) => (
              <li key={p.id} className={styles.item}>
                <span className={styles.flex1}>{p.id}</span>
                <button
                  type="button"
                  onClick={() =>
                    oauthToggleMutation.mutate({
                      id: p.id,
                      enabled: !p.enabled,
                    })
                  }
                  disabled={!isAdmin}
                  className={p.enabled ? styles.toggleOn : styles.toggleOff}
                >
                  {p.enabled ? t("admin.disable") : t("enable")}
                </button>
              </li>
            ))}
          </ul>
        </TabsContent>
        <TabsContent value="mock">
          <h1 className={styles.heading}>{t("mockEmailRecipient")}</h1>
          <div className={styles.inputRow}>
            <input
              type="email"
              value={mockTo}
              onChange={(e) => setMockTo(e.target.value)}
              placeholder={t("mockEmailRecipientPlaceholder")}
              className={styles.input}
              disabled={!isAdmin}
            />
            <button
              type="button"
              onClick={() => mockEmailMutation.mutate(mockTo)}
              disabled={!isAdmin}
              className={styles.saveBtn}
            >
              {t("save")}
            </button>
          </div>
          {mockEmail?.envOverride && (
            <p className={styles.envVar}>{t("envVarOverrides")}</p>
          )}
        </TabsContent>
      </div>
    </Tabs>
  );
}
