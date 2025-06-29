import { withCaseAuthorization } from "@/lib/authz";
import { getLlm } from "@/lib/llm";
import { NextResponse } from "next/server";

export const POST = withCaseAuthorization(
  { obj: "cases", act: "read" },
  async (req: Request) => {
    const { text, lang } = (await req.json()) as { text: string; lang: string };
    if (!text) return NextResponse.json({ error: "No text" }, { status: 400 });
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
