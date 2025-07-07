"use client";
import EditableText from "@/app/components/EditableText";
import MapPreview from "@/app/components/MapPreview";
import { useSession } from "@/app/useSession";
import {
  getCaseOwnerContact,
  getCaseVin,
  getOfficialCaseGps,
} from "@/lib/caseUtils";
import { useTranslation } from "react-i18next";
import { css, cx } from "styled-system/css";
import { token } from "styled-system/tokens";
import { useCaseContext } from "../CaseContext";
import useCaseActions from "../useCaseActions";
import useCaseProgress from "../useCaseProgress";
import AnalysisStatus from "./AnalysisStatus";
import MemberList from "./MemberList";

export default function CaseDetails({
  readOnly = false,
}: { readOnly?: boolean }) {
  const { caseData, members } = useCaseContext();
  const {
    updateVin,
    clearVin,
    updateNote,
    togglePublic,
    toggleClosed,
    toggleArchived,
    reanalyzingPhoto,
  } = useCaseActions();
  useCaseProgress(reanalyzingPhoto);
  const { data: session } = useSession();
  const { t } = useTranslation();
  if (!caseData) return null;
  const ownerContact = getCaseOwnerContact(caseData);
  const isOwner = members.some(
    (m) => m.userId === session?.user?.id && m.role === "owner",
  );
  const isAdmin =
    session?.user?.role === "admin" || session?.user?.role === "superadmin";
  const canTogglePublic = (isAdmin || !!session?.user) && !readOnly;
  const canToggleStatus = (isAdmin || isOwner) && !readOnly;
  const vin = getCaseVin(caseData) || "";
  const vinOverridden = caseData.vinOverride !== null;
  const note = caseData.note || "";
  const gps = getOfficialCaseGps(caseData);
  return (
    <div
      className={cx(
        "order-first p-4 rounded flex flex-col gap-2 text-sm",
        css({ bg: token("colors.surface-subtle") }),
      )}
    >
      <AnalysisStatus readOnly={readOnly} />
      {ownerContact ? (
        <p>
          <span className="font-semibold">{t("owner")}</span> {ownerContact}
        </p>
      ) : null}
      <p>
        <span className="font-semibold">{t("created")}</span>{" "}
        {new Date(caseData.createdAt).toLocaleString()}
      </p>
      <p>
        <span className="font-semibold">{t("visibility")}</span>{" "}
        {caseData.public ? t("public") : t("private")}
        {canTogglePublic ? (
          <button
            type="button"
            onClick={togglePublic}
            className="ml-2 text-blue-500 underline"
            data-testid="toggle-public-button"
          >
            {caseData.public ? t("makePrivate") : t("makePublic")}
          </button>
        ) : null}
      </p>
      <p>
        <span className="font-semibold">{t("status")}</span>{" "}
        {caseData.archived
          ? t("archived")
          : caseData.closed
            ? t("closed")
            : t("open")}
        {canToggleStatus ? (
          <>
            <button
              type="button"
              onClick={toggleClosed}
              className="ml-2 text-blue-500 underline"
            >
              {caseData.closed ? t("markOpen") : t("markClosed")}
            </button>
            <button
              type="button"
              onClick={toggleArchived}
              className="ml-2 text-blue-500 underline"
            >
              {caseData.archived ? t("unarchive") : t("archive")}
            </button>
          </>
        ) : null}
      </p>
      {caseData.streetAddress ? (
        <p>
          <span className="font-semibold">{t("address")}</span>{" "}
          {caseData.streetAddress}
        </p>
      ) : null}
      {caseData.intersection ? (
        <p>
          <span className="font-semibold">{t("intersection")}</span>{" "}
          {caseData.intersection}
        </p>
      ) : null}
      {gps ? (
        <MapPreview
          lat={gps.lat}
          lon={gps.lon}
          width={600}
          height={300}
          className="w-full aspect-[2/1] md:max-w-xl"
          link={`https://www.google.com/maps?q=${gps.lat},${gps.lon}`}
        />
      ) : null}
      <p>
        <span className="font-semibold">{t("vin")}</span>{" "}
        {readOnly ? (
          <span>{vin || ""}</span>
        ) : (
          <EditableText
            value={vin}
            onSubmit={updateVin}
            onClear={vinOverridden ? clearVin : undefined}
            placeholder="VIN"
          />
        )}
      </p>
      <p>
        <span className="font-semibold">{t("note")}</span>{" "}
        {readOnly ? (
          <span>{note || ""}</span>
        ) : (
          <EditableText
            value={note}
            onSubmit={updateNote}
            onClear={note ? () => updateNote("") : undefined}
            placeholder={t("add")}
          />
        )}
      </p>
      <MemberList readOnly={readOnly} />
    </div>
  );
}
