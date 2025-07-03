"use client";
import { apiFetch } from "@/apiClient";
import { useSession } from "@/app/useSession";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
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
    social?: string;
    bio?: string;
    profileStatus?: string;
    profileReason?: string | null;
  }>({
    queryKey: ["/api/profile"],
    queryFn: async () => {
      const res = await apiFetch("/api/profile");
      return (await res.json()) as {
        name?: string;
        image?: string;
        social?: string;
        bio?: string;
        profileStatus?: string;
        profileReason?: string | null;
      };
    },
    enabled: !!session,
  });

  const [name, setName] = useState("");
  const [image, setImage] = useState("");
  const [social, setSocial] = useState("");
  const [bio, setBio] = useState("");
  const bioRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (data) {
      setName(data.name ?? "");
      setImage(data.image ?? "");
      setSocial(data.social ?? "");
      setBio(data.bio ?? "");
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: async () => {
      await apiFetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, image, social, bio }),
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
            <h2 className="text-lg font-bold">{t("userProfile")}</h2>
            <label className="flex flex-col">
              {t("nameLabel")}
              <input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="border p-2"
              />
            </label>
            <label className="flex flex-col">
              {t("imageUrlLabel")}
              <input
                id="image"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                className="border p-2"
              />
            </label>
            <label className="flex flex-col">
              {t("socialLabel")}
              <input
                id="social"
                value={social}
                onChange={(e) => setSocial(e.target.value)}
                className="border p-2"
              />
            </label>
            <label className="flex flex-col">
              {t("bioLabel")}
              <textarea
                ref={bioRef}
                value={bio}
                onInput={() => {
                  if (bioRef.current) {
                    bioRef.current.style.height = "auto";
                    bioRef.current.style.height = `${bioRef.current.scrollHeight}px`;
                  }
                }}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                className="border p-2 resize-y overflow-hidden min-h-[5rem]"
              />
            </label>
            {data?.profileStatus && (
              <p>
                {t("profileStatusLabel")}{" "}
                {t(`profileStatus.${data.profileStatus}`)}
              </p>
            )}
            {data?.profileStatus === "hidden" && data.profileReason ? (
              <p className="text-red-600">{data.profileReason}</p>
            ) : null}
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded"
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
