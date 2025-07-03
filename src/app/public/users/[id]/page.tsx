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
  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-4">
        {user.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.image}
            alt=""
            className="w-24 h-24 rounded-full object-cover"
          />
        ) : (
          <FaUserCircle className="w-24 h-24" />
        )}
        <h1 className="text-2xl font-bold">{user.name ?? t("unknown")}</h1>
      </div>
      {user.profileStatus === "published" ? (
        <>
          {user.bio ? (
            <p className="mb-4 whitespace-pre-line">{user.bio}</p>
          ) : null}
          {user.socialLinks ? (
            <ul className="list-disc pl-5 space-y-1">
              {user.socialLinks.split(/\r?\n/).map((link) => (
                <li key={link}>
                  <a href={link} className="text-blue-600 underline break-all">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </>
      ) : (
        <p className="text-gray-600">{t("profileStatusUnderReview")}</p>
      )}
    </div>
  );
}
