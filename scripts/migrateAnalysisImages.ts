import path from "node:path";
import { eq } from "drizzle-orm";
import { db, migrationsReady } from "../src/lib/db";
import type { ViolationReport } from "../src/lib/openai";
import { orm } from "../src/lib/orm";
import { casePhotoAnalysis, casePhotos } from "../src/lib/schema";

async function run() {
  await migrationsReady;
  const cases = db.prepare("SELECT id, data FROM cases").all() as Array<{
    id: string;
    data: string;
  }>;
  for (const row of cases) {
    const data = JSON.parse(row.data);
    const analysisImages = data.analysis?.images as
      | Record<string, ViolationReport["images"][string]>
      | undefined;
    if (!analysisImages) continue;
    const photos = orm
      .select()
      .from(casePhotos)
      .where(eq(casePhotos.caseId, row.id))
      .all();
    const entries = Object.entries(analysisImages) as Array<
      [string, ViolationReport["images"][string]]
    >;
    for (const [name, info] of entries) {
      const photoRow = photos.find(
        (p: { url: string }) => path.basename(p.url) === name,
      );
      if (!photoRow) continue;
      orm
        .insert(casePhotoAnalysis)
        .values({
          caseId: row.id,
          url: photoRow.url,
          representationScore: info.representationScore,
          highlights:
            info.highlights === undefined || info.highlights === null
              ? null
              : typeof info.highlights === "string"
                ? info.highlights
                : JSON.stringify(info.highlights),
          violation:
            info.violation === undefined || info.violation === null
              ? null
              : info.violation
                ? 1
                : 0,
          paperwork:
            info.paperwork === undefined || info.paperwork === null
              ? null
              : info.paperwork
                ? 1
                : 0,
          paperworkText: info.paperworkText ?? null,
          paperworkInfo: info.paperworkInfo
            ? JSON.stringify(info.paperworkInfo)
            : null,
        })
        .run();
    }
    if (data.analysis) {
      (data.analysis as Partial<Record<string, unknown>>).images = undefined;
      db.prepare("UPDATE cases SET data = ? WHERE id = ?").run(
        JSON.stringify(data),
        row.id,
      );
    }
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
