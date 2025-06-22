import { withCaseAuthorization } from "@/lib/authz";
import {
  analyzePhotoInBackground,
  removePhotoAnalysis,
} from "@/lib/caseAnalysis";
import {
  addCasePhoto,
  getCase,
  removeCasePhoto,
  updateCase,
} from "@/lib/caseStore";
import { NextResponse } from "next/server";

export const DELETE = withCaseAuthorization(
  { obj: "cases", act: "update" },
  async (
    req: Request,
    {
      params,
      session,
    }: {
      params: Promise<{ id: string }>;
      session?: { user?: { id?: string; role?: string } };
    },
  ) => {
    const { id } = await params;
    const { photo } = (await req.json()) as { photo: string };
    const updated = removeCasePhoto(id, photo);
    if (!updated) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    removePhotoAnalysis(id, photo);
    const layered = getCase(id);
    return NextResponse.json(layered);
  },
);

export const POST = withCaseAuthorization(
  { obj: "cases", act: "update" },
  async (
    req: Request,
    {
      params,
      session,
    }: {
      params: Promise<{ id: string }>;
      session?: { user?: { id?: string; role?: string } };
    },
  ) => {
    const { id } = await params;
    const { photo, takenAt, gps } = (await req.json()) as {
      photo: string;
      takenAt?: string | null;
      gps?: { lat: number; lon: number } | null;
    };
    const updated = addCasePhoto(id, photo, takenAt, gps ?? null);
    if (!updated) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const p = updateCase(updated.id, {
      analysisStatus: "pending",
      analysisProgress: { stage: "upload", index: 0, total: 1 },
    });
    analyzePhotoInBackground(p || updated, photo);
    const layered = getCase(id);
    return NextResponse.json(layered);
  },
);
