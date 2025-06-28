"use client";
import { signIn } from "@/app/useSession";
import { withBasePath } from "@/basePath";
import { useTranslation } from "react-i18next";

export default function ClaimBanner({
  show,
  onDismiss,
  className,
}: {
  show: boolean;
  onDismiss: () => void;
  className?: string;
}) {
  const { t } = useTranslation();
  if (!show) return null;
  return (
    <div
      className={`bg-yellow-100 border border-yellow-300 text-yellow-800 p-2 flex items-center justify-between ${className ?? ""}`}
    >
      <span>{t("claim.signInMessage")}</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() =>
            signIn(undefined, { callbackUrl: withBasePath("/claim") })
          }
          className="underline"
        >
          {t("claim.signIn")}
        </button>
        <button
          type="button"
          onClick={onDismiss}
          aria-label={t("claim.dismissAria")}
          className="text-xl leading-none"
        >
          ×
        </button>
      </div>
    </div>
  );
}
