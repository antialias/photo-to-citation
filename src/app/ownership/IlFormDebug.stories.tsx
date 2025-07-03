import type { OwnershipRequestInfo } from "@/lib/ownershipModules";
import type { Meta, StoryObj } from "@storybook/react";
import { PDFDocument } from "pdf-lib";
import { useEffect, useState } from "react";

const pdfUrl = new URL("../../../forms/il/vsd375.pdf", import.meta.url);

const IL_FORM_FIELD_MAP: Record<keyof OwnershipRequestInfo, string> = {
  plate: "1",
  state: "2",
  vin: "3",
  ownerName: "4",
  address1: "5",
  address2: "6",
  city: "7",
  postalCode: "8",
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
    plate: "ABC123",
    state: "IL",
    vin: "1HGCM82633A004352",
    ownerName: "John Doe",
    address1: "123 Main St",
    address2: "",
    city: "Springfield",
    postalCode: "62723",
  },
};
