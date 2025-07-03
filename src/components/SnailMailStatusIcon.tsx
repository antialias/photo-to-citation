"use client";
import { useTranslation } from "react-i18next";
import {
  FaClock,
  FaExclamationCircle,
  FaFileAlt,
  FaMoneyBillAlt,
} from "react-icons/fa";

export default function SnailMailStatusIcon({
  status,
}: {
  status: "queued" | "saved" | "shortfall" | "error";
}) {
  const { t } = useTranslation();
  let Icon = FaClock;
  let color = "text-gray-500";
  switch (status) {
    case "queued":
      Icon = FaClock;
      color = "text-yellow-600";
      break;
    case "saved":
      Icon = FaFileAlt;
      color = "text-blue-600";
      break;
    case "shortfall":
      Icon = FaMoneyBillAlt;
      color = "text-orange-600";
      break;
    case "error":
      Icon = FaExclamationCircle;
      color = "text-red-600";
      break;
    default:
      Icon = FaClock;
  }
  return (
    <span className={`inline-flex items-center gap-1 ${color}`}>
      <Icon className="w-4 h-4" />
      {t(
        status === "queued"
          ? "snailMailQueued"
          : status === "saved"
            ? "snailMailSaved"
            : status === "shortfall"
              ? "snailMailShortfall"
              : "snailMailError",
      )}
    </span>
  );
}
