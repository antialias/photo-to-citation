"use client";
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
  const links = user.socialLinks?.split(/\n+/).filter(Boolean) ?? [];
  return (
    <div className="p-8 flex flex-col items-center gap-4 text-center">
      {user.image ? (
        <Image
          src={user.image}
          alt="avatar"
          width={96}
          height={96}
          className="w-24 h-24 rounded-full object-cover"
        />
      ) : (
        <FaUserCircle className="w-24 h-24" />
      )}
      <h1 className="text-2xl font-bold">{user.name ?? t("unknown")}</h1>
      {user.profileStatus === "published" ? (
        user.bio ? (
          <p className="max-w-prose whitespace-pre-line">{user.bio}</p>
        ) : null
      ) : (
        <p className="text-sm text-gray-600">{t("profileStatusUnderReview")}</p>
      )}
      {links.length ? (
        <div className="flex flex-col gap-1">
          {links.map((l) => (
            <a
              key={l}
              href={l}
              className="text-blue-600 underline"
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
