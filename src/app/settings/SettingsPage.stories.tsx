import type { Meta, StoryObj } from "@storybook/react";
import QueryProvider from "../query-provider";
import SettingsPage from "./page";

const meta: Meta<typeof SettingsPage> = {
  component: SettingsPage,
  title: "Pages/SettingsPage",
};
export default meta;

type Story = StoryObj<typeof SettingsPage>;

function mockFetch() {
  (global as Record<string, unknown>).fetch = async (
    url: string,
    options?: RequestInit,
  ) => {
    if (url.endsWith("/api/credits/balance")) {
      return new Response(JSON.stringify({ balance: 3 }));
    }
    if (url.endsWith("/api/credits/add") && options?.method === "POST") {
      return new Response(null);
    }
    return new Response(null);
  };
}

export const Default: Story = {
  render: () => {
    mockFetch();
    return (
      <QueryProvider>
        <SettingsPage />
      </QueryProvider>
    );
  },
};
