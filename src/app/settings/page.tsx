"use client";
import { apiFetch } from "@/apiClient";
import { useSession } from "@/app/useSession";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { US_STATES } from "@/lib/usStates";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { css } from "styled-system/css";
import { token } from "styled-system/tokens";
import ConfirmDialog from "../components/ConfirmDialog";
import LanguageSwitcher, {
  LANGUAGE_NAMES,
} from "../components/LanguageSwitcher";
import useAddCredits from "../hooks/useAddCredits";
import useCreditBalance from "../hooks/useCreditBalance";

export default function UserSettingsPage() {
  const { data: session } = useSession();
  const { t, i18n } = useTranslation();
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
    address?: string;
    cityStateZip?: string;
    daytimePhone?: string;
    driverLicenseNumber?: string;
    driverLicenseState?: string;
    profileStatus?: string;
    profileReviewNotes?: string | null;
    language?: string;
  }>({
    queryKey: ["/api/profile"],
    queryFn: async () => {
      const res = await apiFetch("/api/profile");
      return (await res.json()) as {
        name?: string;
        image?: string;
        bio?: string;
        socialLinks?: string;
        address?: string;
        cityStateZip?: string;
        daytimePhone?: string;
        driverLicenseNumber?: string;
        driverLicenseState?: string;
        profileStatus?: string;
        profileReviewNotes?: string | null;
        language?: string;
      };
    },
    enabled: !!session,
    refetchInterval: 5000,
  });
  const [name, setName] = useState("");
  const [image, setImage] = useState("");
  const [bio, setBio] = useState("");
  const [links, setLinks] = useState("");
  const [address, setAddress] = useState("");
  const [cityStateZip, setCityStateZip] = useState("");
  const [daytimePhone, setDaytimePhone] = useState("");
  const [driverLicenseNumber, setDriverLicenseNumber] = useState("");
  const [driverLicenseState, setDriverLicenseState] = useState("IL");
  const [language, setLanguage] = useState("en");
  const [confirmLang, setConfirmLang] = useState(false);
  const [status, setStatus] = useState<string | undefined>(undefined);
  const [notes, setNotes] = useState<string | null | undefined>(undefined);
  const styles = {
    container: css({ p: "8" }),
    heading: css({
      fontSize: token("fontSizes.xl"),
      fontWeight: "700",
      mb: "4",
    }),
    tabsList: css({ mb: "4", display: "flex", gap: "4" }),
    form: css({ display: "grid", gap: "2", maxWidth: token("sizes.md") }),
    label: css({ display: "flex", flexDirection: "column" }),
    input: css({ borderWidth: "1px", p: "1" }),
    textarea: css({ borderWidth: "1px", p: "1", resize: "vertical" }),
    statusUnderReview: css({
      fontSize: token("fontSizes.sm"),
      color: token("colors.gray.600"),
    }),
    statusPublished: css({
      fontSize: token("fontSizes.sm"),
      color: token("colors.green.700"),
    }),
    statusHidden: css({
      fontSize: token("fontSizes.sm"),
      color: token("colors.red.600"),
    }),
    submitButton: css({ bg: "blue.500", color: "white", px: "4", py: "2" }),
    creditsContainer: css({
      display: "grid",
      gap: "2",
      maxWidth: token("sizes.sm"),
    }),
    creditsFlex: css({ display: "flex", gap: "2" }),
    creditsInput: css({ borderWidth: "1px", p: "1", flex: "1" }),
    addButton: css({
      bg: "blue.600",
      color: "white",
      px: "2",
      py: "1",
      borderRadius: token("radii.md"),
    }),
  };

  useEffect(() => {
    if (data) {
      setName(data.name ?? "");
      setImage(data.image ?? "");
      setBio(data.bio ?? "");
      setLinks(data.socialLinks ?? "");
      setAddress(data.address ?? "");
      setCityStateZip(data.cityStateZip ?? "");
      setDaytimePhone(data.daytimePhone ?? "");
      setDriverLicenseNumber(data.driverLicenseNumber ?? "");
      setDriverLicenseState(data.driverLicenseState ?? "IL");
      setLanguage(data.language ?? "en");
      setStatus(data.profileStatus);
      setNotes(data.profileReviewNotes ?? null);
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: async () => {
      await apiFetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          image,
          bio,
          socialLinks: links,
          address,
          cityStateZip,
          daytimePhone,
          driverLicenseNumber,
          driverLicenseState,
          language,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
    },
  });

  if (!session) {
    return <div className={styles.container}>{t("notLoggedIn")}</div>;
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>{t("nav.userSettings")}</h1>
      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as "profile" | "credits")}
      >
        <TabsList className={styles.tabsList}>
          <TabsTrigger value="profile">{t("profileTab")}</TabsTrigger>
          <TabsTrigger value="credits">{t("creditsTab")}</TabsTrigger>
        </TabsList>
        <TabsContent value="profile">
          <form
            className={styles.form}
            onSubmit={(e) => {
              e.preventDefault();
              if (language !== data?.language) {
                setConfirmLang(true);
              } else {
                mutation.mutate();
              }
            }}
          >
            <p>
              {t("emailLabel")}{" "}
              {session.user?.email ?? session.user?.name ?? t("unknown")}
            </p>
            <p>
              {t("roleLabel")} {session.user?.role}
            </p>
            <label className={styles.label}>
              {t("nameLabel")}
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={styles.input}
              />
            </label>
            <label className={styles.label}>
              {t("imageUrlLabel")}
              <input
                value={image}
                onChange={(e) => setImage(e.target.value)}
                className={styles.input}
              />
            </label>
            <label className={styles.label}>
              Address
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className={styles.input}
              />
            </label>
            <label className={styles.label}>
              City/State/Zip
              <input
                value={cityStateZip}
                onChange={(e) => setCityStateZip(e.target.value)}
                className={styles.input}
              />
            </label>
            <label className={styles.label}>
              Daytime Phone
              <input
                value={daytimePhone}
                onChange={(e) => setDaytimePhone(e.target.value)}
                className={styles.input}
              />
            </label>
            <label className={styles.label}>
              {t("driverLicenseNumberLabel")}
              <input
                value={driverLicenseNumber}
                onChange={(e) => setDriverLicenseNumber(e.target.value)}
                className={styles.input}
              />
            </label>
            <label className={styles.label}>
              {t("driverLicenseStateLabel")}
              <select
                value={driverLicenseState}
                onChange={(e) => setDriverLicenseState(e.target.value)}
                className={styles.input}
              >
                {US_STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label htmlFor="language" className={styles.label}>
              {t("languageLabel")}
            </label>
            <LanguageSwitcher
              id="language"
              value={language}
              onChange={(v) => setLanguage(v)}
              immediate={false}
            />
            <label className={styles.label}>
              {t("socialLinksLabel")}
              <textarea
                value={links}
                onChange={(e) => setLinks(e.target.value)}
                rows={3}
                className={styles.textarea}
              />
            </label>
            <label className={styles.label}>
              {t("bioLabel")}
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={5}
                className={styles.textarea}
              />
            </label>
            {status === "under_review" && (
              <p className={styles.statusUnderReview}>
                {t("profileStatusUnderReview")}
              </p>
            )}
            {status === "published" && (
              <p className={styles.statusPublished}>
                {t("profileStatusPublished")}
              </p>
            )}
            {status === "hidden" && (
              <p className={styles.statusHidden}>
                {t("profileStatusHidden")} {notes ?? ""}
              </p>
            )}
            <button type="submit" className={styles.submitButton}>
              {t("save")}
            </button>
            <ConfirmDialog
              open={confirmLang}
              message={t("confirmLanguageChange", {
                language: LANGUAGE_NAMES[language],
              })}
              onConfirm={() => {
                setConfirmLang(false);
                mutation.mutate(undefined, {
                  onSuccess() {
                    i18n.changeLanguage(language);
                  },
                });
              }}
              onCancel={() => setConfirmLang(false)}
            />
          </form>
        </TabsContent>
        <TabsContent value="credits">
          <div className={styles.creditsContainer}>
            <p>{t("balanceCredits", { balance })}</p>
            <div className={styles.creditsFlex}>
              <input
                type="number"
                value={usd}
                onChange={(e) => setUsd(e.target.value)}
                className={styles.creditsInput}
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
                className={styles.addButton}
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
