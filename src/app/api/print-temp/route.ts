import { NextResponse } from "next/server";
import { reportCache } from "@/lib/reportCache";
import fs from "fs";
import path from "path";
import os from "os";

export async function POST(req: Request) {
  try {
    const { html } = await req.json();
    if (!html) {
      return NextResponse.json(
        { error: "Missing HTML content" },
        { status: 400 },
      );
    }

    const id =
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);

    // Save in memory cache
    reportCache.set(id, html);

    // Keep memory cache size managed (max 100 items)
    if (reportCache.size > 100) {
      const keys = Array.from(reportCache.keys());
      for (let i = 0; i < 20; i++) {
        reportCache.delete(keys[i]);
      }
    }

    // Also save to disk (os.tmpdir()) as a robust fallback
    try {
      const tempDir = path.join(os.tmpdir(), "food_lab_reports");
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      const filePath = path.join(tempDir, `report-${id}.html`);
      fs.writeFileSync(filePath, html, "utf8");
    } catch (diskErr) {
      console.error(
        "Failed to write to temp disk (falling back purely to memory):",
        diskErr,
      );
    }

    return NextResponse.json({ url: `/api/view-report?id=${id}` });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
