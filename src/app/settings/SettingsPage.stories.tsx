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
  // biome-ignore lint/suspicious/noExplicitAny: mock fetch
  (global as any).fetch = async (url: string, options?: any) => {
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
