import type { Meta, StoryObj } from "@storybook/react";
import NavBar from "./NavBar";

const meta: Meta<typeof NavBar> = {
  component: NavBar,
  title: "Components/NavBar",
};
export default meta;

type Story = StoryObj<typeof NavBar>;

export const Default: Story = {
  render: () => <NavBar />,
};
