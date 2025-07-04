import { withAuthorization } from "@/lib/authz";
import { snailMailProviders } from "@/lib/snailMail";
import { NextResponse } from "next/server";

export const POST = withAuthorization(
  { obj: "snail_mail_providers", act: "update" },
  async (
    _req: Request,
    { params }: { params: Promise<{ id: string }>; session?: { user?: { role?: string } } }
  ) => {
    const { id } = await params;
    const provider = snailMailProviders[id];
    if (!provider || !provider.test) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    try {
      const result = await provider.test();
      return NextResponse.json(result);
    } catch (err) {
      return NextResponse.json({
        success: false,
        message: (err as Error).message,
      });
    }
  },
);
