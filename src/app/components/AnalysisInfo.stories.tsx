import type { ViolationReport } from "@/lib/openai";
import type { Meta, StoryObj } from "@storybook/react";
import AnalysisInfo from "./AnalysisInfo";

const meta: Meta<typeof AnalysisInfo> = {
  title: "Components/AnalysisInfo",
  component: AnalysisInfo,
};
export default meta;

const sample: ViolationReport = {
  violationType: "Illegal Parking",
  details: "Vehicle was parked in a no parking zone",
  location: "Main St near 5th Ave",
  vehicle: {
    make: "Toyota",
    model: "Camry",
    color: "Red",
    licensePlateState: "CA",
    licensePlateNumber: "123ABC",
  },
  images: {},
};

export const Default: StoryObj<typeof AnalysisInfo> = {
  render: () => <AnalysisInfo analysis={sample} />,
};
