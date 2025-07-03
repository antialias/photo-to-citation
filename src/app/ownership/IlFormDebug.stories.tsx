import type { OwnershipRequestInfo } from "@/lib/ownershipModules";
import type { Meta, StoryObj } from "@storybook/react";
import { PDFDocument } from "pdf-lib";
import { useEffect, useState } from "react";

const pdfUrl = new URL("../../../forms/il/vsd375.pdf", import.meta.url);

const IL_FORM_FIELD_MAP: Record<keyof OwnershipRequestInfo, string> = {
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

function IlFormViewer(props: OwnershipRequestInfo) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    async function build() {
      const response = await fetch(pdfUrl);
      const bytes = await response.arrayBuffer();
      const pdf = await PDFDocument.load(bytes);
      const form = pdf.getForm();
      for (const [key, field] of Object.entries(IL_FORM_FIELD_MAP) as [
        keyof OwnershipRequestInfo,
        string,
      ][]) {
        const val = props[key];
        try {
          form.getTextField(field).setText(val ?? "");
        } catch {}
      }
      const b64 = await pdf.saveAsBase64({ dataUri: true });
      setUrl(b64);
    }
    void build();
  }, [props]);
  if (!url) return <div>Loading...</div>;
  return <iframe src={url} className="w-full h-96 border" title="IL Form" />;
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
    requesterProfessionalLicenseOrARDCNumber: "requesterProfessionalLicenseOrARDCNumber",
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
  },
};
