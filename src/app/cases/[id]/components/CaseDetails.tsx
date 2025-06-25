"use client";
import EditableText from "@/app/components/EditableText";
import MapPreview from "@/app/components/MapPreview";
import { useSession } from "@/app/useSession";
import {
  getCaseOwnerContact,
  getCaseVin,
  getOfficialCaseGps,
} from "@/lib/caseUtils";
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
  const { progress } = useCaseProgress(reanalyzingPhoto);
  const { data: session } = useSession();
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
  const plateNumberOverridden =
    caseData.analysisOverrides?.vehicle?.licensePlateNumber !== undefined;
  const plateStateOverridden =
    caseData.analysisOverrides?.vehicle?.licensePlateState !== undefined;
  const gps = getOfficialCaseGps(caseData);
  return (
    <div className="order-first bg-gray-100 dark:bg-gray-800 p-4 rounded flex flex-col gap-2 text-sm">
      <AnalysisStatus readOnly={readOnly} />
      {ownerContact ? (
        <p>
          <span className="font-semibold">Owner:</span> {ownerContact}
        </p>
      ) : null}
      <p>
        <span className="font-semibold">Created:</span>{" "}
        {new Date(caseData.createdAt).toLocaleString()}
      </p>
      <p>
        <span className="font-semibold">Visibility:</span>{" "}
        {caseData.public ? "Public" : "Private"}
        {canTogglePublic ? (
          <button
            type="button"
            onClick={togglePublic}
            className="ml-2 text-blue-500 underline"
            data-testid="toggle-public-button"
          >
            Make {caseData.public ? "Private" : "Public"}
          </button>
        ) : null}
      </p>
      <p>
        <span className="font-semibold">Status:</span>{" "}
        {caseData.archived ? "Archived" : caseData.closed ? "Closed" : "Open"}
        {canToggleStatus ? (
          <>
            <button
              type="button"
              onClick={toggleClosed}
              className="ml-2 text-blue-500 underline"
            >
              Mark {caseData.closed ? "Open" : "Closed"}
            </button>
            <button
              type="button"
              onClick={toggleArchived}
              className="ml-2 text-blue-500 underline"
            >
              {caseData.archived ? "Unarchive" : "Archive"}
            </button>
          </>
        ) : null}
      </p>
      {caseData.streetAddress ? (
        <p>
          <span className="font-semibold">Address:</span>{" "}
          {caseData.streetAddress}
        </p>
      ) : null}
      {caseData.intersection ? (
        <p>
          <span className="font-semibold">Intersection:</span>{" "}
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
        <span className="font-semibold">VIN:</span>{" "}
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
        <span className="font-semibold">Note:</span>{" "}
        {readOnly ? (
          <span>{note || ""}</span>
        ) : (
          <EditableText
            value={note}
            onSubmit={updateNote}
            onClear={note ? () => updateNote("") : undefined}
            placeholder="Add note"
          />
        )}
      </p>
      <MemberList readOnly={readOnly} />
    </div>
  );
}
