import fs from "node:fs";
import path from "node:path";
import { getCase, updateCase } from "@/lib/caseStore";
import { analyzeViolation, ocrPaperwork } from "@/lib/openai";
import { fetchCaseVinInBackground } from "@/lib/vinLookup";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const url = new URL(req.url);
  const photo = url.searchParams.get("photo");
  if (!photo) {
    return NextResponse.json({ error: "Missing photo" }, { status: 400 });
  }
  const c = getCase(id);
  if (!c || !c.photos.includes(photo)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const filePath = path.join(
    process.cwd(),
    "public",
    photo.replace(/^\/+/, ""),
  );
  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const buffer = fs.readFileSync(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const mime =
    ext === ".png"
      ? "image/png"
      : ext === ".webp"
        ? "image/webp"
        : "image/jpeg";
  const dataUrl = `data:${mime};base64,${buffer.toString("base64")}`;
  const result = await analyzeViolation([
    { filename: path.basename(photo), url: dataUrl },
  ]);
  const info = result.images?.[path.basename(photo)];
  if (info?.paperwork && !info.paperworkText) {
    const ocr = await ocrPaperwork({ url: dataUrl });
    info.paperworkText = ocr.text;
    if (ocr.info) info.paperworkInfo = ocr.info;
  }
  const baseAnalysis = c.analysis ?? { vehicle: {}, images: {} };
  const newAnalysis = {
    ...baseAnalysis,
    vehicle: { ...baseAnalysis.vehicle },
  } as typeof baseAnalysis;
  let changed = false;
  if (!baseAnalysis.violationType && result.violationType) {
    newAnalysis.violationType = result.violationType;
    changed = true;
  }
  const vehicle = result.vehicle || {};
  if (!baseAnalysis.vehicle?.make && vehicle.make) {
    newAnalysis.vehicle.make = vehicle.make;
    changed = true;
  }
  if (!baseAnalysis.vehicle?.model && vehicle.model) {
    newAnalysis.vehicle.model = vehicle.model;
    changed = true;
  }
  if (!baseAnalysis.vehicle?.licensePlateState && vehicle.licensePlateState) {
    newAnalysis.vehicle.licensePlateState = vehicle.licensePlateState;
    changed = true;
  }
  if (!baseAnalysis.vehicle?.licensePlateNumber && vehicle.licensePlateNumber) {
    newAnalysis.vehicle.licensePlateNumber = vehicle.licensePlateNumber;
    changed = true;
  }
  if (info?.paperworkInfo) {
    const pVeh = info.paperworkInfo.vehicle;
    if (!baseAnalysis.vehicle?.licensePlateState && pVeh.licensePlateState) {
      newAnalysis.vehicle.licensePlateState = pVeh.licensePlateState;
      changed = true;
    }
    if (!baseAnalysis.vehicle?.licensePlateNumber && pVeh.licensePlateNumber) {
      newAnalysis.vehicle.licensePlateNumber = pVeh.licensePlateNumber;
      changed = true;
    }
    if (!c.vin && pVeh.vin) {
      updateCase(id, { vin: pVeh.vin });
    }
  }
  const updates: Record<string, unknown> = {};
  if (changed) updates.analysis = newAnalysis;
  if (Object.keys(updates).length > 0) {
    const updated = updateCase(id, updates);
    if (updated) fetchCaseVinInBackground(updated);
  }
  return NextResponse.json(getCase(id));
}
