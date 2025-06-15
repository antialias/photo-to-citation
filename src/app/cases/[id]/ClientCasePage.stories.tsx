import type { Case } from "@/lib/caseStore";
import type { Meta, StoryObj } from "@storybook/react";
import ClientCasePage from "./ClientCasePage";

const meta: Meta<typeof ClientCasePage> = {
  component: ClientCasePage,
  title: "Pages/ClientCasePage",
};
export default meta;

type Story = StoryObj<typeof ClientCasePage>;

const base: Case = {
  id: "123",
  photos: [
    "https://placehold.co/600x400?text=main",
    "https://placehold.co/601x400?text=alt",
  ],
  photoTimes: {},
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
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

export const Completed: Story = {
  render: () => <ClientCasePage caseId={base.id} initialCase={base} />,
};

export const PendingAnalysis: Story = {
  render: () => (
    <ClientCasePage
      caseId="124"
      initialCase={{
        ...base,
        id: "124",
        analysis: null,
        analysisStatus: "pending",
      }}
    />
  ),
};

export const FailedAnalysis: Story = {
  render: () => (
    <ClientCasePage
      caseId="125"
      initialCase={{
        ...base,
        id: "125",
        analysis: null,
        analysisStatus: "failed",
        analysisStatusCode: 500,
      }}
    />
  ),
};

export const TruncatedError: Story = {
  render: () => (
    <ClientCasePage
      caseId="126"
      initialCase={{
        ...base,
        id: "126",
        analysis: null,
        analysisStatus: "failed",
        analysisStatusCode: 400,
        analysisError: "truncated",
      }}
    />
  ),
};
