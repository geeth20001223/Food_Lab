import { reportCache } from "@/lib/reportCache";
import fs from "fs";
import path from "path";
import os from "os";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return new Response("Missing report ID", { status: 400 });
        }

        // 1. Try reading from memory cache
        let html = reportCache.get(id);

        // 2. Try reading from temp disk if not in memory
        if (!html) {
            try {
                const filePath = path.join(os.tmpdir(), "food_lab_reports", `report-${id}.html`);
                if (fs.existsSync(filePath)) {
                    html = fs.readFileSync(filePath, "utf8");
                }
            } catch (diskErr) {
                console.error("Failed to read from temp disk:", diskErr);
            }
        }

        if (!html) {
            return new Response("Report not found or has expired", { status: 404 });
        }

        // Return the HTML content directly so the browser renders it
        return new Response(html, {
            headers: {
                "Content-Type": "text/html; charset=utf-8",
                "Cache-Control": "no-store, max-age=0",
            },
        });
    } catch (err: any) {
        return new Response(`Error loading report: ${err.message}`, { status: 500 });
    }
}
