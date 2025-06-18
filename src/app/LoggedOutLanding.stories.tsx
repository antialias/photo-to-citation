import type { Meta, StoryObj } from "@storybook/react";
import LoggedOutLanding from "./LoggedOutLanding";

const meta: Meta<typeof LoggedOutLanding> = {
  component: LoggedOutLanding,
  title: "Pages/LoggedOutLanding",
};
export default meta;

type Story = StoryObj<typeof LoggedOutLanding>;

export const Default: Story = {
  render: () => <LoggedOutLanding />,
};
