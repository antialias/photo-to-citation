"use client";
import { space } from "@/styleTokens";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import { FaUserCircle } from "react-icons/fa";
import { css } from "styled-system/css";
import { token } from "styled-system/tokens";

export interface PublicUser {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  bio: string | null;
  socialLinks: string | null;
  profileStatus: string;
  profileReviewNotes: string | null;
  role: string;
}

export default function PublicProfileClient({
  user,
}: {
  user: PublicUser;
}) {
  const { t } = useTranslation();
  const styles = {
    container: css({
      mt: "4",
      mx: "auto",
      px: "6",
      py: "8",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: space.gap,
      textAlign: "center",
      maxWidth: "32rem",
      backgroundColor: {
        base: token("colors.gray.50"),
        _dark: token("colors.gray.800"),
      },
      borderRadius: token("radii.lg"),
      boxShadow: token("shadows.default"),
    }),
    avatarImg: css({
      width: "6rem",
      height: "6rem",
      borderRadius: "9999px",
      objectFit: "cover",
      borderWidth: "2px",
      borderColor: {
        base: token("colors.gray.300"),
        _dark: token("colors.gray.600"),
      },
    }),
    icon: css({
      width: "6rem",
      height: "6rem",
      color: token("colors.gray.400"),
    }),
    heading: css({
      fontSize: token("fontSizes.2xl"),
      fontWeight: 700,
    }),
    bio: css({
      maxWidth: "65ch",
      whiteSpace: "pre-line",
    }),
    reviewText: css({
      fontSize: token("fontSizes.sm"),
      color: token("colors.gray.600"),
    }),
    linksWrapper: css({
      display: "flex",
      flexDirection: "column",
      gap: "1",
    }),
    link: css({
      color: token("colors.blue.600"),
      textDecorationLine: "underline",
      _hover: { color: token("colors.blue.700") },
    }),
    title: css({
      fontSize: token("fontSizes.3xl"),
      fontWeight: 700,
    }),
  };
  const links = user.socialLinks?.split(/\n+/).filter(Boolean) ?? [];
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>{t("userProfile")}</h1>
      {user.image ? (
        <Image
          src={user.image}
          alt="avatar"
          width={96}
          height={96}
          className={styles.avatarImg}
        />
      ) : (
        <FaUserCircle className={styles.icon} />
      )}
      <h2 className={styles.heading}>{user.name ?? t("unknown")}</h2>
      {user.profileStatus === "published" ? (
        user.bio ? (
          <p className={styles.bio}>{user.bio}</p>
        ) : null
      ) : (
        <p className={styles.reviewText}>{t("profileStatusUnderReview")}</p>
      )}
      {links.length ? (
        <div className={styles.linksWrapper}>
          {links.map((l) => (
            <a
              key={l}
              href={l}
              className={styles.link}
              target="_blank"
              rel="noopener noreferrer"
            >
              {l}
            </a>
          ))}
        </div>
      ) : null}
    </div>
  );
}
