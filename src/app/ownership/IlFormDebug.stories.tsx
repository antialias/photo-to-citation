import fs from "node:fs";
import path from "node:path";
import type { OwnershipRequestInfo } from "@/lib/ownershipModules";
import { IL_FORM_FIELD_MAP } from "@/lib/ownershipModules";
import type { Meta, StoryObj } from "@storybook/react";
import { PDFDocument } from "pdf-lib";
import { useEffect, useState } from "react";

const pdfBase64 = fs.readFileSync(
  path.resolve(process.cwd(), "forms", "il", "vsd375.pdf"),
  "base64",
);

function IlFormViewer(props: OwnershipRequestInfo) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    async function build() {
      const pdf = await PDFDocument.load(Buffer.from(pdfBase64, "base64"));
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
