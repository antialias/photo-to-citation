import { initI18n } from "@/i18n.server";
import { getUser } from "@/lib/userStore";
import { cookies, headers } from "next/headers";
import { notFound } from "next/navigation";
import { FaUserCircle } from "react-icons/fa";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function PublicUserProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cookieStore = await cookies();
  let lang = cookieStore.get("language")?.value;
  if (!lang) {
    const accept = (await headers()).get("accept-language") ?? "";
    const supported = ["en", "es", "fr"];
    for (const part of accept.split(",")) {
      const code = part.split(";")[0].trim().toLowerCase().split("-")[0];
      if (supported.includes(code)) {
        lang = code;
        break;
      }
    }
    lang = lang ?? "en";
  }
  const { t } = await initI18n(lang);
  const user = getUser(id);
  if (!user) notFound();
  const published = user.profileStatus === "published";
  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">{t("userProfile")}</h1>
      <div className="flex items-center gap-4 mb-4">
        {user.image ? (
          <img
            src={user.image}
            alt="avatar"
            className="w-24 h-24 rounded-full object-cover"
          />
        ) : (
          <FaUserCircle className="w-24 h-24 text-gray-400" />
        )}
        <span className="text-xl font-semibold">
          {user.name ?? user.email ?? t("unknown")}
        </span>
      </div>
      {published ? (
        user.bio ? (
          <p className="whitespace-pre-line mb-4">{user.bio}</p>
        ) : null
      ) : (
        <p className="text-gray-600 italic mb-4">
          {t("profileStatusUnderReview")}
        </p>
      )}
      {user.socialLinks ? (
        <div className="space-y-1">
          {user.socialLinks.split(/\r?\n/).map((link) => (
            <a
              key={link}
              href={link}
              className="block text-blue-600 underline break-all"
            >
              {link}
            </a>
          ))}
        </div>
      ) : null}
    </div>
  );
}
