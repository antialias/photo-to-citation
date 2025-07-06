"use client";
import * as stylex from "@stylexjs/stylex";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import { FaUserCircle } from "react-icons/fa";

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
  const styles = stylex.create({
    container: {
      padding: "2rem",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "1rem",
      textAlign: "center",
    },
    avatarImg: {
      width: "6rem",
      height: "6rem",
      borderRadius: "9999px",
      objectFit: "cover",
    },
    icon: {
      width: "6rem",
      height: "6rem",
    },
    heading: {
      fontSize: "1.5rem",
      fontWeight: 700,
    },
    bio: {
      maxWidth: "65ch",
      whiteSpace: "pre-line",
    },
    reviewText: {
      fontSize: "0.875rem",
      color: "#4b5563",
    },
    linksWrapper: {
      display: "flex",
      flexDirection: "column",
      gap: "0.25rem",
    },
    link: {
      color: "#2563eb",
      textDecorationLine: "underline",
    },
  });
  const links = user.socialLinks?.split(/\n+/).filter(Boolean) ?? [];
  return (
    <div {...stylex.props(styles.container)}>
      {user.image ? (
        <Image
          src={user.image}
          alt="avatar"
          width={96}
          height={96}
          {...stylex.props(styles.avatarImg)}
        />
      ) : (
        <FaUserCircle {...stylex.props(styles.icon)} />
      )}
      <h1 {...stylex.props(styles.heading)}>{user.name ?? t("unknown")}</h1>
      {user.profileStatus === "published" ? (
        user.bio ? (
          <p {...stylex.props(styles.bio)}>{user.bio}</p>
        ) : null
      ) : (
        <p {...stylex.props(styles.reviewText)}>
          {t("profileStatusUnderReview")}
        </p>
      )}
      {links.length ? (
        <div {...stylex.props(styles.linksWrapper)}>
          {links.map((l) => (
            <a
              key={l}
              href={l}
              {...stylex.props(styles.link)}
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
