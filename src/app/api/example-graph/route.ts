import { NextResponse } from "next/server";

export async function GET() {
  const chart =
    "graph TD\n" +
    "A[Start] --> B{Is it working?}\n" +
    "B -->|Yes| C[Great]\n" +
    "B -->|No| D[Fix it]\n";
  return NextResponse.json({ chart });
}
