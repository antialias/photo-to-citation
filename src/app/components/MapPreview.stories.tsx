import type { Meta, StoryObj } from "@storybook/react";
import MapPreview from "./MapPreview";

const meta: Meta<typeof MapPreview> = {
  component: MapPreview,
  title: "Components/MapPreview",
};
export default meta;

type Story = StoryObj<typeof MapPreview>;

export const Default: Story = {
  render: () => (
    <MapPreview lat={41.88} lon={-87.78} width={400} height={300} />
  ),
};
