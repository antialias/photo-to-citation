import type { OwnershipRequestInfo } from "@/lib/ownershipModules";
import type { Meta, StoryObj } from "@storybook/react";
import { PDFDocument } from "pdf-lib";
import { useEffect, useState } from "react";
import { css } from "styled-system/css";

const pdfUrl = new URL("../../../forms/il/vsd375.pdf", import.meta.url);

const IL_FORM_FIELD_MAP: Record<string, string> = {
  driversLicense: "6",
  plate: "16",
  vin: "13",
  vehicleYear: "11",
  ownerName: "15",
  vehicleMake: "12",
  requesterName: "1",
  requesterAddress: "4",
  requesterBusinessName: "2",
  requesterCityStateZip: "3",
  requesterDaytimePhoneNumber: "5",
  requesterDriverLicenseNumber: "6",
  requesterEmailAddress: "7",
  requesterPhoneNumber: "9",
  titleNumber: "10",
  plateYear: "17",
  reasonForRequestingRecords: "19",
  plateCategoryOther: "14",
  requesterPositionInOrginization: "20",
  requesterProfessionalLicenseOrARDCNumber: "21",
};

const IL_FORM_CHECKBOX_MAP: Record<string, string> = {
  titleSearch: "cb1",
  registrationSearch: "cb2",
  certifiedTitleSearch: "cb3",
  certifiedRegistrationSearch: "cb4",
  microfilmWithSearchOption: "cb5",
  passenger: "cb8",
  bTruck: "cb6",
  plateCategoryOtherCheck: "cb7",
  reasonA: "cb9",
  reasonB: "cb10",
  reasonC: "cb11",
  reasonD: "cb12",
  reasonE: "cb13",
  reasonF: "cb14",
  reasonG: "cb15",
  reasonH: "cb16",
  reasonI: "cb17",
  reasonJ: "cb18",
  reasonK: "cb19",
  reasonL: "cb20",
  reasonM: "cb21",
  reasonN: "cb22",
  reasonO: "cb23",
  microfilmOnly: "cb5a",
};

function IlFormViewer(props: OwnershipRequestInfo) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    async function build() {
      const response = await fetch(pdfUrl);
      const bytes = await response.arrayBuffer();
      const pdf = await PDFDocument.load(bytes);
      const form = pdf.getForm();
      for (const [key, field] of Object.entries(IL_FORM_FIELD_MAP)) {
        const val = (props as unknown as Record<string, unknown>)[key];
        try {
          form.getTextField(field).setText(val ? String(val) : "");
        } catch {}
      }
      for (const [key, field] of Object.entries(IL_FORM_CHECKBOX_MAP)) {
        const val = (props as unknown as Record<string, unknown>)[key];
        try {
          const cb = form.getCheckBox(field);
          if (val) {
            cb.check();
          } else {
            cb.uncheck();
          }
        } catch {}
      }
      const b64 = await pdf.saveAsBase64({ dataUri: true });
      setUrl(b64);
    }
    void build();
  }, [props]);
  if (!url) return <div>Loading...</div>;
  return (
    <iframe
      src={url}
      className={css({ w: "full", h: "96", borderWidth: "1px" })}
      title="IL Form"
    />
  );
}

const meta: Meta<typeof IlFormViewer> = {
  component: IlFormViewer,
  title: "Debug/IllinoisOwnershipForm",
};
export default meta;

type Story = StoryObj<typeof IlFormViewer>;

export const Default: Story = {
  args: {
    requesterName: "requesterName",
    requesterAddress: "requesterAddress",
    requesterBusinessName: "requesterBusinessName",
    requesterCityStateZip: "requesterCityStateZip",
    requesterDaytimePhoneNumber: "requesterDaytimePhoneNumber",
    requesterDriverLicenseNumber: "requesterDriverLicenseNumber",
    requesterEmailAddress: "requesterEmailAddress",
    requesterPhoneNumber: "requesterPhoneNumber",
    requesterPositionInOrginization: "requesterPositionInOrginization",
    requesterProfessionalLicenseOrARDCNumber:
      "requesterProfessionalLicenseOrARDCNumber",
    titleNumber: "titleNumber",
    plateYear: "plateYear",
    reasonForRequestingRecords: "reasonForRequestingRecords",
    plateCategoryOther: "plateCategoryOther",
    vehicleYear: "vehicleYear",
    vehicleMake: "vehicleMake",
    plate: "ABC123",
    state: "IL",
    vin: "1HGCM82633A004352",
    ownerName: "John Doe",
    titleSearch: true,
    registrationSearch: true,
    certifiedTitleSearch: false,
    certifiedRegistrationSearch: false,
    microfilmWithSearchOption: true,
    passenger: true,
    bTruck: false,
    plateCategoryOtherCheck: false,
    reasonA: true,
    reasonB: false,
    reasonC: false,
    reasonD: false,
    reasonE: false,
    reasonF: false,
    reasonG: false,
    reasonH: false,
    reasonI: false,
    reasonJ: false,
    reasonK: false,
    reasonL: false,
    reasonM: false,
    reasonN: false,
    reasonO: false,
    microfilmOnly: false,
  },
};
