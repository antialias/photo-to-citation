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
  render: function WithLiveLlmStory() {
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
      new Response(JSON.stringify({ photos: ["a.jpg"] }));
    return () => {
      window.fetch = original;
    };
  }, []);
}

export const CaseAction: Story = {
  render: function CaseActionStory() {
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
  render: function EditActionStory() {
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
  render: function PhotoNoteActionStory() {
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
  render: function MixedActionsStory() {
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

export const ResponseOnly: Story = {
  render: function ResponseOnlyStory() {
    usePhotoStub();
    const reply: CaseChatReply = {
      response: "Just a regular response",
      actions: [],
      noop: false,
    };
    return <CaseChat caseId="1" onChat={async () => reply} />;
  },
};

export const Noop: Story = {
  render: function NoopStory() {
    usePhotoStub();
    const reply: CaseChatReply = {
      response: "",
      actions: [],
      noop: true,
    };
    return <CaseChat caseId="1" onChat={async () => reply} />;
  },
};

function useChatError(status: number) {
  useEffect(() => {
    const original = window.fetch;
    window.fetch = async (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input.toString();
      if (url.includes("/api/cases/1/chat")) {
        return new Response(JSON.stringify({ error: "fail" }), { status });
      }
      if (url.includes("/api/cases/1")) {
        return new Response(JSON.stringify({ photos: ["a.jpg"] }));
      }
      return original(input);
    };
    return () => {
      window.fetch = original;
    };
  }, [status]);
}

function useChatNetworkFailure() {
  useEffect(() => {
    const original = window.fetch;
    window.fetch = async (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input.toString();
      if (url.includes("/api/cases/1/chat")) {
        throw new Error("network failure");
      }
      if (url.includes("/api/cases/1")) {
        return new Response(JSON.stringify({ photos: ["a.jpg"] }));
      }
      return original(input);
    };
    return () => {
      window.fetch = original;
    };
  }, []);
}

export const ServerUnavailable: Story = {
  render: function ServerUnavailableStory() {
    useChatError(503);
    return <CaseChat caseId="1" />;
  },
};

export const InvalidResponse: Story = {
  render: function InvalidResponseStory() {
    useChatError(502);
    return <CaseChat caseId="1" />;
  },
};

export const UnreachableServer: Story = {
  render: function UnreachableServerStory() {
    useChatNetworkFailure();
    return <CaseChat caseId="1" />;
  },
};
