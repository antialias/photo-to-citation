import type { Meta, StoryObj } from "@storybook/react";
import NavBar from "./NavBar";

const meta: Meta<typeof NavBar> = {
  title: "Components/NavBar",
  component: NavBar,
};
export default meta;

export const Default: StoryObj<typeof NavBar> = {
  render: () => <NavBar />,
};
