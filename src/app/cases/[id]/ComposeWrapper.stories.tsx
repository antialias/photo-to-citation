import type { Case } from "@/lib/caseStore";
import { reportModules } from "@/lib/reportModules";
import type { Meta, StoryObj } from "@storybook/react";
import ComposeWrapper from "./ComposeWrapper";

const meta: Meta<typeof ComposeWrapper> = {
  component: ComposeWrapper,
  title: "Pages/ComposeWrapper",
};
export default meta;

type Story = StoryObj<typeof ComposeWrapper>;

const base: Case = {
  id: "123",
  photos: [
    "https://placehold.co/600x400?text=main",
    "https://placehold.co/601x400?text=alt",
  ],
  photoTimes: {},
  createdAt: new Date().toISOString(),
  gps: { lat: 41.88, lon: -87.78 },
  streetAddress: "123 Main St",
  intersection: "Main & 1st",
  vin: "1HGCM82633A004352",
  vinOverride: null,
  analysis: {
    violationType: "parking",
    details: "Blocking sidewalk",
    location: "Oak Park",
    vehicle: {
      licensePlateNumber: "ABC123",
      model: "Civic",
    },
    images: {},
  },
  analysisOverrides: null,
  analysisStatus: "complete",
  analysisStatusCode: 200,
  sentEmails: [],
  ownershipRequests: [],
};

function mockFetch() {
  (global as Record<string, unknown>).fetch = async (url: string) => {
    if (url.includes(`/cases/${base.id}/report`)) {
      return new Response(
        JSON.stringify({
          email: { subject: "Violation Report", body: "Report body" },
          attachments: base.photos,
          module: reportModules["oak-park"],
        }),
      );
    }
    return new Response(JSON.stringify(base));
  };
}

export const Default: Story = {
  render: () => {
    mockFetch();
    return <ComposeWrapper caseData={base} caseId={base.id} />;
  },
};
