import { withCaseAuthorization } from "@/lib/authz";
import { getCase, setCaseTranslation } from "@/lib/caseStore";
import { getLlm } from "@/lib/llm";
import { NextResponse } from "next/server";

function getValueByPath(obj: unknown, path: string): unknown {
  const parts = path.replace(/\[(\w+)\]/g, ".$1").split(".");
  let current: unknown = obj;
  for (let i = 0; i < parts.length; i++) {
    if (typeof current !== "object" || current === null) return undefined;
    let key = parts[i];
    let value = (current as Record<string, unknown>)[key];
    if (value === undefined) {
      for (let j = i + 1; j < parts.length; j++) {
        key += `.${parts[j]}`;
        value = (current as Record<string, unknown>)[key];
        if (value !== undefined) {
          i = j;
          break;
        }
      }
    }
    if (value === undefined) return undefined;
    current = value;
  }
  return current;
}

export const POST = withCaseAuthorization(
  { obj: "cases", act: "update" },
  async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    const { path, lang } = (await req.json()) as { path: string; lang: string };
    const c = getCase(id);
    if (!c) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const value = getValueByPath(c, path);
    if (!value)
      return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    const text =
      typeof value === "string"
        ? value
        : typeof value === "object" && value !== null
          ? ((value as Record<string, string>).en ??
            Object.values(value as Record<string, string>)[0] ??
            "")
          : "";
    if (!text) return NextResponse.json({ error: "No text" }, { status: 400 });
    const { client, model } = getLlm("draft_email");
    const res = await client.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content: `You translate text. Reply only with the translation in ${lang}.`,
        },
        { role: "user", content: text },
      ],
    });
    const translation = res.choices[0]?.message?.content?.trim() ?? "";
    const updated = setCaseTranslation(id, path, lang, translation);
    if (!updated)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    const layered = getCase(id);
    return NextResponse.json(layered);
  },
);
