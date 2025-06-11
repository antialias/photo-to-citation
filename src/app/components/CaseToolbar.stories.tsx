import type { Meta, StoryObj } from "@storybook/react";
import CaseToolbar from "./CaseToolbar";

const meta: Meta<typeof CaseToolbar> = {
  title: "Components/CaseToolbar",
  component: CaseToolbar,
};
export default meta;

export const Default: StoryObj<typeof CaseToolbar> = {
  render: () => <CaseToolbar caseId="CASE123" />,
};
