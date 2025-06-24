import { withCaseAuthorization } from "@/lib/authz";
import { caseActions } from "@/lib/caseActions";
import { getCase } from "@/lib/caseStore";
import { getLlm } from "@/lib/llm";
import { NextResponse } from "next/server";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

export const POST = withCaseAuthorization(
  { obj: "cases", act: "read" },
  async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    const body = (await req.json()) as {
      messages: Array<{ role: "user" | "assistant"; content: string }>;
    };
    const c = getCase(id);
    if (!c) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const analysis = c.analysis;
    const vehicle = analysis?.vehicle ?? {};
    const location =
      c.streetAddress ||
      c.intersection ||
      (c.gps ? `${c.gps.lat}, ${c.gps.lon}` : "unknown location");
    const contextLines = analysis?.images
      ? Object.entries(analysis.images)
          .map(([name, info]) => `Photo ${name}: ${info.context || ""}`)
          .join("\n")
      : "";
    const actionList = caseActions
      .map((a) => `- ${a.label} [${a.id}]: ${a.description}`)
      .join("\\n");
    const system = `You are a helpful legal assistant for the Photo To Citation app. The user is asking about a case with these details:\nViolation: ${analysis?.violationType || ""}\nDescription: ${analysis?.details || ""}\nLocation: ${location}\nLicense Plate: ${vehicle.licensePlateState || ""} ${vehicle.licensePlateNumber || ""}\nNumber of photos: ${c.photos.length}. ${contextLines ? `\nImage contexts:\n${contextLines}` : ""}. When there is no user question yet, decide if you should proactively suggest a next action or useful observation. If you have nothing helpful, reply with [noop]. \nTo include an action button, insert a token like [action:compose] in your reply. Write the token exactly with no spaces or label text inside.\nFor example: \nYou may want to notify the vehicle owner. [action:notify-owner]\nThe UI will replace the token with a button. Available actions:\n${actionList}`;

    const messages: ChatCompletionMessageParam[] = [
      { role: "system", content: system },
      ...body.messages,
    ];

    const { client, model } = getLlm("draft_email");
    const res = await client.chat.completions.create({
      model,
      messages,
      max_tokens: 800,
    });
    const reply = res.choices[0]?.message?.content ?? "";
    return NextResponse.json({ reply });
  },
);
