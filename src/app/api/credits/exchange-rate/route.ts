import { withAuthorization } from "@/lib/authz";
import { getCreditSettings, setExchangeRate } from "@/lib/creditSettings";
import { NextResponse } from "next/server";

export const GET = withAuthorization({ obj: "credits" }, async () => {
  const { usdPerCredit } = getCreditSettings();
  return NextResponse.json({ usdPerCredit });
});

export const PUT = withAuthorization(
  { obj: "superadmin", act: "update" },
  async (req: Request) => {
    const { usdPerCredit } = (await req.json()) as { usdPerCredit: number };
    const settings = setExchangeRate(usdPerCredit);
    return NextResponse.json(settings);
  },
);
