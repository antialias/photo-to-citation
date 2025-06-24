import type { CaseChatReply } from "@/lib/caseChat";
import type { Meta, StoryObj } from "@storybook/react";
import OpenAI from "openai";
import { useEffect, useState } from "react";
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
    ): Promise<CaseChatReply> {
      if (!apiKey) return { response: "", actions: [], noop: true };
      const client = new OpenAI({
        apiKey,
        baseURL: baseUrl || undefined,
        dangerouslyAllowBrowser: true,
      });
      const res = await client.chat.completions.create({
        model: "gpt-4o",
        messages,
        max_tokens: 800,
        response_format: { type: "json_object" },
      });
      const text = res.choices[0]?.message?.content ?? "{}";
      return JSON.parse(text) as CaseChatReply;
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

function MockWrapper({
  reply,
  caseData,
}: { reply: CaseChatReply; caseData?: Record<string, unknown> }) {
  useEffect(() => {
    const original = global.fetch;
    global.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input.toString();
      if (url.includes("/api/cases/story")) {
        return new Response(JSON.stringify(caseData ?? { photos: [] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      return original(input, init);
    };
    return () => {
      global.fetch = original;
    };
  }, [caseData]);

  async function onChat() {
    return reply;
  }

  return <CaseChat caseId="story" onChat={onChat} />;
}

export const CaseAction: Story = {
  render: () => (
    <MockWrapper
      reply={{
        response: "You can draft a report now.",
        actions: [{ id: "compose" }],
        noop: false,
      }}
    />
  ),
};

export const EditAction: Story = {
  render: () => (
    <MockWrapper
      reply={{
        response: "Plate looks like ABC123.",
        actions: [{ field: "plate", value: "ABC123" }],
        noop: false,
      }}
    />
  ),
};

export const PhotoNoteAction: Story = {
  render: () => (
    <MockWrapper
      reply={{
        response: "Add this photo note.",
        actions: [{ photo: "a.jpg", note: "bad parking" }],
        noop: false,
      }}
      caseData={{ photos: ["/uploads/a.jpg"] }}
    />
  ),
};

export const MultiAction: Story = {
  render: () => (
    <MockWrapper
      reply={{
        response: "Here are several suggestions.",
        actions: [
          { id: "notify-owner" },
          { field: "state", value: "CA" },
          { photo: "a.jpg", note: "clear view" },
        ],
        noop: false,
      }}
      caseData={{ photos: ["/uploads/a.jpg"] }}
    />
  ),
};
