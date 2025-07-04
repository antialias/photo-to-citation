"use client";
import { useSession } from "@/app/useSession";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import SystemStatusClient from "../system-status/SystemStatusClient";
import AppConfigurationTab from "./AppConfigurationTab";
import InviteUserForm from "./components/InviteUserForm";
import RulesTable from "./components/RulesTable";
import UsersTable from "./components/UsersTable";
import { useCasbinRules } from "./hooks/useCasbinRules";
import { useUsers } from "./hooks/useUsers";

export interface UserRecord {
  id: string;
  email: string | null;
  name: string | null;
  role: string;
}

export interface CasbinRule {
  id: string;
  ptype: string;
  v0?: string | null;
  v1?: string | null;
  v2?: string | null;
  v3?: string | null;
  v4?: string | null;
  v5?: string | null;
}

export type RuleInput = Omit<CasbinRule, "id">;

export default function AdminPageClient({
  initialUsers,
  initialRules,
  initialTab = "users",
}: {
  initialUsers: UserRecord[];
  initialRules: RuleInput[];
  initialTab?: "users" | "config" | "status";
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"users" | "config" | "status">(initialTab);
  const { data: session } = useSession();
  const isSuperadmin = session?.user?.role === "superadmin";

  const userHooks = useUsers(initialUsers);
  const ruleHooks = useCasbinRules(
    initialRules,
    session?.user?.role === "superadmin",
  );
  const { t } = useTranslation();

  return (
    <Tabs
      value={tab}
      onValueChange={(v) => {
        setTab(v as "users" | "config" | "status");
        router.replace(`?tab=${v}`);
      }}
    >
      <TabsList className="mb-4 flex gap-4 border-b">
        <TabsTrigger value="users">{t("admin.userManagement")}</TabsTrigger>
        <TabsTrigger value="config">{t("admin.appConfiguration")}</TabsTrigger>
        {isSuperadmin && (
          <TabsTrigger value="status">{t("admin.systemStatus")}</TabsTrigger>
        )}
      </TabsList>
      <TabsContent value="users">
        <>
          <h1 className="text-xl font-bold mb-4">{t("admin.users")}</h1>
          <InviteUserForm hooks={userHooks} />
          <UsersTable hooks={userHooks} />
          <h1 className="text-xl font-bold my-4">{t("admin.casbinRules")}</h1>
          <RulesTable hooks={ruleHooks} />
        </>
      </TabsContent>
      <TabsContent value="config">
        <AppConfigurationTab />
      </TabsContent>
      {isSuperadmin && (
        <TabsContent value="status">
          {tab === "status" && <SystemStatusClient />}
        </TabsContent>
      )}
    </Tabs>
  );
}
