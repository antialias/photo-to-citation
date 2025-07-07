"use client";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import { FaUserCircle } from "react-icons/fa";
import { css } from "styled-system/css";

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
      padding: "2rem",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "1rem",
      textAlign: "center",
      borderWidth: "1px",
      borderRadius: "0.5rem",
      background: "var(--background)",
      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    }),
    avatarImg: css({
      width: "6rem",
      height: "6rem",
      borderRadius: "9999px",
      objectFit: "cover",
    }),
    icon: css({
      width: "6rem",
      height: "6rem",
    }),
    heading: css({
      fontSize: "1.5rem",
      fontWeight: 700,
    }),
    bio: css({
      maxWidth: "65ch",
      whiteSpace: "pre-line",
    }),
    reviewText: css({
      fontSize: "0.875rem",
      color: "#4b5563",
    }),
    linksWrapper: css({
      display: "flex",
      flexDirection: "column",
      gap: "0.25rem",
    }),
    link: css({
      color: "#2563eb",
      textDecorationLine: "underline",
    }),
  };
  const links = user.socialLinks?.split(/\n+/).filter(Boolean) ?? [];
  return (
    <div className={styles.container}>
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
      <h1 className={styles.heading}>{user.name ?? t("unknown")}</h1>
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
