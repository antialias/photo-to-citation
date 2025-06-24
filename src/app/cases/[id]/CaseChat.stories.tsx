import type { CaseChatReply } from "@/lib/caseChat";
import type { Meta, StoryObj } from "@storybook/react";
import OpenAI from "openai";
import { useState } from "react";
import CaseChat from "./CaseChat";

function mockFetch(photos: string[] = []) {
  (global as Record<string, unknown>).fetch = async () =>
    new Response(JSON.stringify({ photos }));
}

const meta: Meta<typeof CaseChat> = {
  component: CaseChat,
  title: "Components/CaseChat",
};
export default meta;

type Story = StoryObj<typeof CaseChat>;

export const CaseAction: Story = {
  render: () => {
    mockFetch();
    const onChat = async () =>
      Promise.resolve<CaseChatReply>({
        response: "You could file a follow up report.",
        actions: [{ id: "followup" }],
        noop: false,
      });
    return <CaseChat caseId="story" onChat={onChat} />;
  },
};

export const EditActions: Story = {
  render: () => {
    mockFetch();
    const onChat = async () =>
      Promise.resolve<CaseChatReply>({
        response: "Update the case details.",
        actions: [
          { field: "vin", value: "1HGCM82633A004352" },
          { field: "note", value: "Blocking hydrant" },
        ],
        noop: false,
      });
    return <CaseChat caseId="story" onChat={onChat} />;
  },
};

export const PhotoNote: Story = {
  render: () => {
    mockFetch(["/uploads/a.jpg"]);
    const onChat = async () =>
      Promise.resolve<CaseChatReply>({
        response: "Add a note to photo a.jpg.",
        actions: [{ photo: "a.jpg", note: "Clear view" }],
        noop: false,
      });
    return <CaseChat caseId="story" onChat={onChat} />;
  },
};

export const MixedActions: Story = {
  render: () => {
    mockFetch(["/uploads/a.jpg"]);
    const onChat = async () =>
      Promise.resolve<CaseChatReply>({
        response: "Here are some suggestions.",
        actions: [
          { id: "compose" },
          { field: "state", value: "IL" },
          { photo: "a.jpg", note: "Vehicle in frame" },
        ],
        noop: false,
      });
    return <CaseChat caseId="story" onChat={onChat} />;
  },
};

export const WithLiveLlm: Story = {
  render: () => {
    const [apiKey, setApiKey] = useState("");
    const [baseUrl, setBaseUrl] = useState("");

    async function onChat(
      messages: Array<{ role: "user" | "assistant"; content: string }>,
    ): Promise<CaseChatReply> {
      if (!apiKey)
        return { response: "", actions: [], noop: true } as CaseChatReply;
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
      const text = res.choices[0]?.message?.content ?? "{}";
      return JSON.parse(text) as CaseChatReply;
    }

    mockFetch(["/uploads/a.jpg"]);

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
