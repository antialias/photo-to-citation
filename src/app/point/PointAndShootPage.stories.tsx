import type { Meta, StoryObj } from "@storybook/react";
import PointAndShootPage from "./page";

const meta: Meta<typeof PointAndShootPage> = {
  component: PointAndShootPage,
  title: "Pages/PointAndShootPage",
};
export default meta;

type Story = StoryObj<typeof PointAndShootPage>;

export const Default: Story = {
  render: () => <PointAndShootPage />,
};
