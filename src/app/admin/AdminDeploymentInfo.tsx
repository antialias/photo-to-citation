import { initI18n } from "@/i18n.server";
import { config } from "@/lib/config";
import { cookies, headers } from "next/headers";

export default async function AdminDeploymentInfo() {
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
  const {
    NEXT_PUBLIC_DEPLOY_TIME,
    NEXT_PUBLIC_APP_COMMIT,
    NEXT_PUBLIC_APP_VERSION,
  } = config;
  return (
    <div className="mt-4 text-sm text-gray-600 dark:text-gray-400 space-y-1">
      <p>
        {t("admin.deployedAt", {
          date: NEXT_PUBLIC_DEPLOY_TIME ?? t("unknown"),
        })}
      </p>
      <p>
        {t("admin.deployCommit", {
          commit: NEXT_PUBLIC_APP_COMMIT ?? t("unknown"),
        })}
      </p>
      <p>
        {t("admin.deployVersion", {
          version: NEXT_PUBLIC_APP_VERSION ?? t("unknown"),
        })}
      </p>
    </div>
  );
}
