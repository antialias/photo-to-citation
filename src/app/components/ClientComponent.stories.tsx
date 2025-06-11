import type { Meta, StoryObj } from "@storybook/react";
import ClientComponent from "./ClientComponent";

const meta: Meta<typeof ClientComponent> = {
  component: ClientComponent,
  title: "Components/ClientComponent",
};
export default meta;

type Story = StoryObj<typeof ClientComponent>;

export const Default: Story = {};
