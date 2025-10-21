import { caseEvents } from "@/lib/caseEvents";
import { config } from "@/lib/config";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(req: Request) {
  if (!config.TEST_APIS) {
    return new NextResponse(null, { status: 404 });
  }
  const url = new URL(req.url);
  const job = url.searchParams.get("job");
  const caseId = url.searchParams.get("caseId");
  if (!job || !caseId) {
    return NextResponse.json(
      { error: "job and caseId required" },
      { status: 400 },
    );
  }
  return new Promise<NextResponse>((resolve) => {
    const timer = setTimeout(() => {
      cleanup();
      resolve(new NextResponse(null, { status: 202 }));
    }, 30000);
    function cleanup() {
      clearTimeout(timer);
      caseEvents.off("taskComplete", handler);
    }
    function handler(data: { job: string; data: unknown }) {
      const id =
        (data.data as { id?: string; caseData?: { id?: string } }).id ??
        (data.data as { caseData?: { id?: string } }).caseData?.id;
      if (data.job === job && id === caseId) {
        cleanup();
        resolve(new NextResponse(null, { status: 200 }));
      }
    }
    caseEvents.on("taskComplete", handler);
  });
}
