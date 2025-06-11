import type { Meta, StoryObj } from "@storybook/react";
import MapPreview from "./MapPreview";

const meta: Meta<typeof MapPreview> = {
  title: "Components/MapPreview",
  component: MapPreview,
};
export default meta;

export const Default: StoryObj<typeof MapPreview> = {
  render: () => (
    <MapPreview lat={37.773972} lon={-122.431297} width={400} height={200} />
  ),
};
