"use client";
import { apiFetch } from "@/apiClient";
import { useSession } from "@/app/useSession";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import useAddCredits from "../hooks/useAddCredits";
import useCreditBalance from "../hooks/useCreditBalance";

export default function UserSettingsPage() {
  const { data: session } = useSession();
  const { t } = useTranslation();
  const [tab, setTab] = useState<"profile" | "credits">("profile");
  const [usd, setUsd] = useState("0");
  const { data: balanceData } = useCreditBalance(tab === "credits");
  const addCreditsMutation = useAddCredits();
  const balance = balanceData?.balance ?? 0;
  const queryClient = useQueryClient();
  const { data } = useQuery<{
    name?: string;
    image?: string;
    socialLinks?: string;
    bio?: string;
    profileStatus?: string;
    reviewReason?: string;
  }>({
    queryKey: ["/api/profile"],
    queryFn: async () => {
      const res = await apiFetch("/api/profile");
      return (await res.json()) as {
        name?: string;
        image?: string;
        socialLinks?: string;
        bio?: string;
        profileStatus?: string;
        reviewReason?: string;
      };
    },
    enabled: !!session,
  });
  const [name, setName] = useState("");
  const [image, setImage] = useState("");
  const [social, setSocial] = useState("");
  const [bio, setBio] = useState("");
  useEffect(() => {
    if (data) {
      setName(data.name ?? "");
      setImage(data.image ?? "");
      setSocial(data.socialLinks ?? "");
      setBio(data.bio ?? "");
    }
  }, [data]);
  const mutation = useMutation({
    async mutationFn() {
      await apiFetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, image, socialLinks: social, bio }),
      });
    },
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
    },
  });

  if (!session) {
    return <div className="p-8">{t("notLoggedIn")}</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-xl font-bold mb-4">{t("nav.userSettings")}</h1>
      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as "profile" | "credits")}
      >
        <TabsList className="mb-4 flex gap-4">
          <TabsTrigger value="profile">{t("profileTab")}</TabsTrigger>
          <TabsTrigger value="credits">{t("creditsTab")}</TabsTrigger>
        </TabsList>
        <TabsContent value="profile">
          <form
            className="grid gap-2 max-w-md"
            onSubmit={(e) => {
              e.preventDefault();
              mutation.mutate();
            }}
          >
            <p>
              {t("emailLabel")}{" "}
              {session.user?.email ?? session.user?.name ?? t("unknown")}
            </p>
            <p>
              {t("roleLabel")} {session.user?.role}
            </p>
            <p>{t(`profileStatus.${data?.profileStatus ?? "under_review"}`)}</p>
            {data?.reviewReason && (
              <p className="text-red-700">{data.reviewReason}</p>
            )}
            <label htmlFor="name">{t("nameLabel")}</label>
            <input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border p-1"
            />
            <label htmlFor="image">{t("imageUrlLabel")}</label>
            <input
              id="image"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              className="border p-1"
            />
            <label htmlFor="social">{t("socialLinksLabel")}</label>
            <input
              id="social"
              value={social}
              onChange={(e) => setSocial(e.target.value)}
              className="border p-1"
            />
            <label htmlFor="bio">{t("bioLabel")}</label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="border p-1 min-h-[6rem]"
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-2 py-1 rounded"
            >
              {t("save")}
            </button>
          </form>
        </TabsContent>
        <TabsContent value="credits">
          <div className="grid gap-2 max-w-sm">
            <p>{t("balanceCredits", { balance })}</p>
            <div className="flex gap-2">
              <input
                type="number"
                value={usd}
                onChange={(e) => setUsd(e.target.value)}
                className="border p-1 flex-1"
              />
              <button
                type="button"
                onClick={() =>
                  addCreditsMutation.mutate(Number(usd), {
                    onSuccess() {
                      setUsd("0");
                    },
                  })
                }
                className="bg-blue-600 text-white px-2 py-1 rounded"
              >
                {t("add")}
              </button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
