import type { Meta, StoryObj } from "@storybook/react";
import SettingsPage from "./page";

const meta: Meta<typeof SettingsPage> = {
  component: SettingsPage,
  title: "Pages/SettingsPage",
};
export default meta;

type Story = StoryObj<typeof SettingsPage>;

function mockFetch() {
  const statuses = [
    { id: "carfax", enabled: true, failureCount: 0 },
    { id: "dmv", enabled: false, failureCount: 2 },
  ];
  (global as Record<string, unknown>).fetch = async (
    url: string,
    options?: RequestInit,
  ) => {
    if (options && options.method === "PUT") return new Response(null);
    return new Response(JSON.stringify(statuses));
  };
}

export const Default: Story = {
  render: () => {
    mockFetch();
    return <SettingsPage />;
  },
};
