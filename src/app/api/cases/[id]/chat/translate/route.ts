import { withCaseAuthorization } from "@/lib/authz";
import { getLlm } from "@/lib/llm";
import { NextResponse } from "next/server";

export const POST = withCaseAuthorization(
  { obj: "cases", act: "read" },
  async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
    const { text, lang } = (await req.json()) as { text: string; lang: string };
    if (!text || !lang) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    const { client, model } = getLlm("draft_email");
    const res = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: `Translate the following text to ${lang}.` },
        { role: "user", content: text },
      ],
    });
    const translation = res.choices[0]?.message?.content?.trim() ?? "";
    return NextResponse.json({ translation });
  },
);
