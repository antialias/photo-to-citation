import { withCaseAuthorization } from "@/lib/authz";
import { getCaseChatMessage, setCaseChatTranslation } from "@/lib/caseStore";
import { getLlm } from "@/lib/llm";
import { NextResponse } from "next/server";

export const POST = withCaseAuthorization(
  { obj: "cases", act: "update" },
  async (
    req: Request,
    { params }: { params: Promise<{ id: string; msg: string }> },
  ) => {
    const { id, msg } = await params;
    const { lang } = (await req.json()) as { lang: string };
    const m = getCaseChatMessage(id, msg);
    if (!m) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const base =
      m.content[m.lang] ?? m.content.en ?? Object.values(m.content)[0] ?? "";
    if (!base) return NextResponse.json({ error: "No text" }, { status: 400 });
    const { client, model } = getLlm("draft_email");
    const res = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: `Translate the following text to ${lang}.` },
        { role: "user", content: base },
      ],
    });
    const translation = res.choices[0]?.message?.content?.trim() ?? "";
    const updated = setCaseChatTranslation(id, msg, lang, translation);
    if (!updated)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ text: translation });
  },
);
