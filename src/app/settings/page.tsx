"use client";
import { apiFetch } from "@/apiClient";
import { useSession } from "@/app/useSession";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import useAddCredits from "../hooks/useAddCredits";
import useCreditBalance from "../hooks/useCreditBalance";
import useEventSource from "../hooks/useEventSource";

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
    bio?: string;
    socialLinks?: string;
    profileStatus?: string;
    profileReviewNotes?: string | null;
  }>({
    queryKey: ["/api/profile"],
    queryFn: async () => {
      const res = await apiFetch("/api/profile");
      return (await res.json()) as {
        name?: string;
        image?: string;
        bio?: string;
        socialLinks?: string;
        profileStatus?: string;
        profileReviewNotes?: string | null;
      };
    },
    enabled: !!session,
  });
  useEventSource<{
    name?: string;
    image?: string;
    bio?: string;
    socialLinks?: string;
    profileStatus?: string;
    profileReviewNotes?: string | null;
  }>(session ? "/api/profile/stream" : null, (payload) => {
    queryClient.setQueryData(["/api/profile"], payload);
  });
  const [name, setName] = useState("");
  const [image, setImage] = useState("");
  const [bio, setBio] = useState("");
  const [links, setLinks] = useState("");
  const [status, setStatus] = useState<string | undefined>(undefined);
  const [notes, setNotes] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    if (data) {
      setName(data.name ?? "");
      setImage(data.image ?? "");
      setBio(data.bio ?? "");
      setLinks(data.socialLinks ?? "");
      setStatus(data.profileStatus);
      setNotes(data.profileReviewNotes ?? null);
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: async () => {
      await apiFetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, image, bio, socialLinks: links }),
      });
    },
    onSuccess: () => {
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
            <label className="flex flex-col">
              {t("nameLabel")}
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="border p-1"
              />
            </label>
            <label className="flex flex-col">
              {t("imageUrlLabel")}
              <input
                value={image}
                onChange={(e) => setImage(e.target.value)}
                className="border p-1"
              />
            </label>
            <label className="flex flex-col">
              {t("socialLinksLabel")}
              <textarea
                value={links}
                onChange={(e) => setLinks(e.target.value)}
                rows={3}
                className="border p-1 resize-y"
              />
            </label>
            <label className="flex flex-col">
              {t("bioLabel")}
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={5}
                className="border p-1 resize-y"
              />
            </label>
            {status === "under_review" && (
              <p className="text-sm text-gray-600">
                {t("profileStatusUnderReview")}
              </p>
            )}
            {status === "published" && (
              <p className="text-sm text-green-700">
                {t("profileStatusPublished")}
              </p>
            )}
            {status === "hidden" && (
              <p className="text-sm text-red-600">
                {t("profileStatusHidden")} {notes ?? ""}
              </p>
            )}
            <button type="submit" className="bg-blue-500 text-white px-4 py-2">
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
