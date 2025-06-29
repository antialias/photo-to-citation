"use client";
import { useSession } from "@/app/useSession";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { useCaseContext } from "../CaseContext";

export default function PublicViewBanner({
  caseId,
  show = true,
  className,
}: {
  caseId: string;
  show?: boolean;
  className?: string;
}) {
  const { members } = useCaseContext();
  const { data: session } = useSession();
  const { t } = useTranslation();
  const isMember = members.some((m) => m.userId === session?.user?.id);
  if (!show || !isMember) return null;
  return (
    <div
      className={`bg-blue-100 border border-blue-300 text-blue-800 p-2 flex items-center justify-between ${className ?? ""}`}
    >
      <span>{t("publicViewBanner.message")}</span>
      <Link href={`/cases/${caseId}`} className="underline">
        {t("publicViewBanner.link")}
      </Link>
    </div>
  );
}
