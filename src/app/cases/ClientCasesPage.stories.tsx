import type { Case } from "@/lib/caseStore";
import type { Meta, StoryObj } from "@storybook/react";
import ClientCasesPage from "./ClientCasesPage";

const meta: Meta<typeof ClientCasesPage> = {
  component: ClientCasesPage,
  title: "Pages/ClientCasesPage",
};
export default meta;

type Story = StoryObj<typeof ClientCasesPage>;

const caseBase: Omit<Case, "id"> = {
  photos: ["https://placehold.co/600x400?text=photo"],
  photoTimes: {},
  createdAt: new Date().toISOString(),
  gps: { lat: 41.88, lon: -87.78 },
  streetAddress: null,
  intersection: null,
  vin: null,
  vinOverride: null,
  analysis: null,
  analysisOverrides: null,
  analysisStatus: "pending",
  analysisStatusCode: null,
  sentEmails: [],
  ownershipRequests: [],
};

export const MultipleCases: Story = {
  render: () => {
    const cases: Case[] = [
      {
        id: "1",
        ...caseBase,
        analysis: {
          violationType: "parking",
          details: "Blocking sidewalk",
          vehicle: { licensePlateNumber: "ABC123" },
          location: "Oak Park",
          images: {},
        },
        analysisStatus: "complete",
      },
      {
        id: "2",
        ...caseBase,
        photos: [
          "https://placehold.co/600x400?text=photo2",
          "https://placehold.co/601x400?text=photo3",
        ],
      },
    ];
    return <ClientCasesPage initialCases={cases} />;
  },
};

export const SelectedCase: Story = {
  render: () => {
    const cases: Case[] = [
      { id: "1", ...caseBase },
      { id: "2", ...caseBase },
    ];
    return <ClientCasesPage initialCases={cases} />;
  },
};
