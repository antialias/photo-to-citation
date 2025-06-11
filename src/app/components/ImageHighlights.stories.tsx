import type { ViolationReport } from "@/lib/openai";
import type { Meta, StoryObj } from "@storybook/react";
import ImageHighlights from "./ImageHighlights";

const meta: Meta<typeof ImageHighlights> = {
  title: "Components/ImageHighlights",
  component: ImageHighlights,
};
export default meta;

const sample: ViolationReport = {
  violationType: "Illegal Parking",
  details: "Vehicle was parked in a no parking zone",
  images: {
    "car.jpg": {
      representationScore: 0.95,
      highlights: "License plate visible",
    },
  },
};

export const Default: StoryObj<typeof ImageHighlights> = {
  render: () => <ImageHighlights analysis={sample} photo="car.jpg" />,
};
