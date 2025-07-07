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
  const container = css({
    padding: "2rem",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "1rem",
    textAlign: "center",
  });
  const avatarImg = css({
    width: "6rem",
    height: "6rem",
    borderRadius: "9999px",
    objectFit: "cover",
  });
  const icon = css({
    width: "6rem",
    height: "6rem",
  });
  const heading = css({
    fontSize: "1.5rem",
    fontWeight: 700,
  });
  const bio = css({
    maxWidth: "65ch",
    whiteSpace: "pre-line",
  });
  const reviewText = css({
    fontSize: "0.875rem",
    color: "#4b5563",
  });
  const linksWrapper = css({
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
  });
  const link = css({
    color: "#2563eb",
    textDecorationLine: "underline",
  });
  const links = user.socialLinks?.split(/\n+/).filter(Boolean) ?? [];
  return (
    <div className={container}>
      {user.image ? (
        <Image
          src={user.image}
          alt="avatar"
          width={96}
          height={96}
          className={avatarImg}
        />
      ) : (
        <FaUserCircle className={icon} />
      )}
      <h1 className={heading}>{user.name ?? t("unknown")}</h1>
      {user.profileStatus === "published" ? (
        user.bio ? (
          <p className={bio}>{user.bio}</p>
        ) : null
      ) : (
        <p className={reviewText}>{t("profileStatusUnderReview")}</p>
      )}
      {links.length ? (
        <div className={linksWrapper}>
          {links.map((l) => (
            <a
              key={l}
              href={l}
              className={link}
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
