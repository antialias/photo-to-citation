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
      });
      const text = res.choices[0]?.message?.content ?? "";
      try {
        return JSON.parse(text) as CaseChatReply;
      } catch {
        return { response: text, actions: [], noop: false };
      }
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

function usePhotoStub() {
  useEffect(() => {
    const original = window.fetch;
    window.fetch = async () =>
      new Response(JSON.stringify({ photos: ["/uploads/a.jpg"] }));
    return () => {
      window.fetch = original;
    };
  }, []);
}

export const CaseAction: Story = {
  render: () => {
    usePhotoStub();
    const reply: CaseChatReply = {
      response: "Notify the owner?",
      actions: [{ id: "notify-owner" }],
      noop: false,
    };
    return <CaseChat caseId="1" onChat={async () => reply} />;
  },
};

export const EditAction: Story = {
  render: () => {
    usePhotoStub();
    const reply: CaseChatReply = {
      response: "Plate looks like ABC123",
      actions: [{ field: "plate", value: "ABC123" }],
      noop: false,
    };
    return <CaseChat caseId="1" onChat={async () => reply} />;
  },
};

export const PhotoNoteAction: Story = {
  render: () => {
    usePhotoStub();
    const reply: CaseChatReply = {
      response: "Add note to photo",
      actions: [{ photo: "a.jpg", note: "Clear" }],
      noop: false,
    };
    return <CaseChat caseId="1" onChat={async () => reply} />;
  },
};

export const MixedActions: Story = {
  render: () => {
    usePhotoStub();
    const reply: CaseChatReply = {
      response: "Multiple suggestions",
      actions: [
        { id: "compose" },
        { field: "state", value: "IL" },
        { photo: "a.jpg", note: "Zoom here" },
      ],
      noop: false,
    };
    return <CaseChat caseId="1" onChat={async () => reply} />;
  },
};

export const NoActions: Story = {
  render: () => {
    usePhotoStub();
    const reply: CaseChatReply = {
      response: "Nothing to do",
      actions: [],
      noop: false,
    };
    return <CaseChat caseId="1" onChat={async () => reply} />;
  },
};

export const Conversation: Story = {
  render: () => {
    usePhotoStub();
    const replies: CaseChatReply[] = [
      { response: "First", actions: [{ id: "compose" }], noop: false },
      {
        response: "Second",
        actions: [{ field: "state", value: "CA" }],
        noop: false,
      },
    ];
    let i = 0;
    return (
      <CaseChat caseId="1" onChat={async () => replies[i++] ?? replies[1]} />
    );
  },
};
