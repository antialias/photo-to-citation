import type { Meta, StoryObj } from "@storybook/react";
import OpenAI from "openai";
import { useState } from "react";
import CaseChat from "./CaseChat";

const meta: Meta<typeof CaseChat> = {
  component: CaseChat,
  title: "Components/CaseChat",
};
export default meta;

type Story = StoryObj<typeof CaseChat>;

export const WithLiveLlm: Story = {
  render: () => {
    const [apiKey, setApiKey] = useState("");
    const [baseUrl, setBaseUrl] = useState("");

    async function onChat(
      messages: Array<{ role: "user" | "assistant"; content: string }>,
    ) {
      if (!apiKey) return "";
      const client = new OpenAI({
        apiKey,
        baseURL: baseUrl || undefined,
        dangerouslyAllowBrowser: true,
      });
      const res = await client.chat.completions.create({
        model: "gpt-4o",
        messages,
        max_tokens: 800,
      });
      return res.choices[0]?.message?.content ?? "";
    }

    return (
      <div className="space-y-2 p-4">
        <label className="block">
          API Key:
          <input
            type="text"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="border rounded w-full p-1"
          />
        </label>
        <label className="block">
          Base URL:
          <input
            type="text"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="https://api.openai.com/v1"
            className="border rounded w-full p-1"
          />
        </label>
        <CaseChat caseId="story" onChat={onChat} />
      </div>
    );
  },
};
