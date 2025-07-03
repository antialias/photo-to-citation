import { withAuthorization } from "@/lib/authz";
import { config } from "@/lib/config";
import { getMockEmailSettings, setMockEmailTo } from "@/lib/mockEmailSettings";
import { NextResponse } from "next/server";

export const GET = withAuthorization({ obj: "superadmin" }, async () => {
  const settings = getMockEmailSettings();
  return NextResponse.json({
    to: config.MOCK_EMAIL_TO ?? settings.to,
    envOverride: config.MOCK_EMAIL_TO != null,
    settingsTo: settings.to,
  });
});

export const PUT = withAuthorization(
  { obj: "superadmin", act: "update" },
  async (req: Request) => {
    const { to } = (await req.json()) as { to: string };
    const settings = setMockEmailTo(to);
    return NextResponse.json(settings);
  },
);
