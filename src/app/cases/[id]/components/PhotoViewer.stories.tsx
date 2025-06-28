import type { Case } from "@/lib/caseStore";
import type { Meta, StoryObj } from "@storybook/react";
import PhotoViewer from "./PhotoViewer";

const meta: Meta<typeof PhotoViewer> = {
  component: PhotoViewer,
  title: "Components/PhotoViewer",
};
export default meta;

type Story = StoryObj<typeof PhotoViewer>;

const base: Case = {
  id: "1",
  photos: ["https://placehold.co/600x400"],
  photoTimes: {},
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  analysis: null,
  analysisStatus: "pending",
  public: false,
};

export const Default: Story = {
  render: () => (
    <PhotoViewer
      caseData={base}
      selectedPhoto={base.photos[0]}
      progress={null}
      progressDescription="Analyzing..."
      requestValue={50}
      isPhotoReanalysis={false}
      reanalyzingPhoto={null}
      analysisActive={false}
      readOnly={false}
      photoNote=""
      updatePhotoNote={async () => {}}
      removePhoto={async () => {}}
      reanalyzePhoto={async () => {}}
      onTranslate={async () => {}}
    />
  ),
};
