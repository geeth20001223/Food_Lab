import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/* ================= SAFE ROW ================= */
function safeRow(row: any) {
  return {
    id: row.id,
    sample_date: row.sample_date ?? "",
    collection_time: row.collection_time ?? "",
    sample_number: row.sample_number ?? "",
    reference_number: row.reference_number ?? "",
    sample_type: row.sample_type ?? "",
    phi_area: row.phi_area ?? "",
    moh_area: row.moh_area ?? "",
    analysis_details: row.analysis_details ?? "",
    handed_over_by: row.handed_over_by ?? "",
    analyzed_by: row.analyzed_by ?? "",
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

/* ================= GENERATE SAMPLE NUMBER ================= */
async function generateSampleNumber(db: any, sampleType: string) {
  const prefixMap: any = {
    Water: "WTR",
    Spices: "SPC",
    Salt: "SLT",
  };

  const typeCode = prefixMap[sampleType];

  if (!typeCode) {
    throw new Error("Invalid sample type");
  }

  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");

  // Match pattern: PFLF/WTR/20260224/%
  const likePattern = `PFLF/${typeCode}/${date}/%`;

  const [rows]: any = await db.execute(
    `SELECT sample_number 
         FROM food_registering
         WHERE sample_number LIKE ?
         ORDER BY sample_number DESC
         LIMIT 1`,
    [likePattern],
  );

  let sequence = "001";

  if (rows.length > 0) {
    const last = rows[0].sample_number as string;
    // Format: PFLF/WTR/20260224/007  →  last segment is the sequence
    const parts = last.split("/");
    const num = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(num)) {
      sequence = String(num + 1).padStart(3, "0");
    }
  }

  return `PFLF/${typeCode}/${date}/${sequence}`;
}

/* ================= GET ================= */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";

  try {
    const [rows] = await db.execute(
      `SELECT r.*, COALESCE(a.analyzed_by, r.analyzed_by) as analyzed_by 
             FROM food_registering r
             LEFT JOIN lab_analysis a ON r.id = a.food_register_id
             WHERE r.sample_number LIKE ? 
                OR r.reference_number LIKE ? 
                OR r.phi_area LIKE ? 
                OR r.moh_area LIKE ?
             ORDER BY r.id DESC`,
      [`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`],
    );

    return NextResponse.json((rows as any[]).map(safeRow));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/* ================= POST ================= */
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const sampleNumber = await generateSampleNumber(db, body.sample_type);

    await db.execute(
      `INSERT INTO food_registering
            (sample_date, collection_time, sample_number, reference_number, sample_type,
             phi_area, moh_area, analysis_details, handed_over_by, analyzed_by,
             created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        body.sample_date ?? "",
        body.collection_time ?? "",
        sampleNumber,
        body.reference_number ?? "",
        body.sample_type ?? "",
        body.phi_area ?? "",
        body.moh_area ?? "",
        body.analysis_details ?? "",
        body.handed_over_by ?? "",
        body.analyzed_by ?? "",
      ],
    );

    return NextResponse.json({
      message: "Inserted successfully",
      sample_number: sampleNumber,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/* ================= PUT ================= */
export async function PUT(req: Request) {
  try {
    const body = await req.json();

    await db.execute(
      `UPDATE food_registering SET
            sample_date=?,
            collection_time=?,
            reference_number=?,
            sample_type=?,
            phi_area=?,
            moh_area=?,
            analysis_details=?,
            handed_over_by=?,
            analyzed_by=?,
            updated_at=NOW()
            WHERE id=?`,
      [
        body.sample_date ?? "",
        body.collection_time ?? "",
        body.reference_number ?? "",
        body.sample_type ?? "",
        body.phi_area ?? "",
        body.moh_area ?? "",
        body.analysis_details ?? "",
        body.handed_over_by ?? "",
        body.analyzed_by ?? "",
        body.id,
      ],
    );

    return NextResponse.json({
      message: "Updated successfully",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/* ================= DELETE ================= */
export async function DELETE(req: Request) {
  try {
    const body = await req.json();

    await db.execute("DELETE FROM food_registering WHERE id=?", [body.id]);

    return NextResponse.json({
      message: "Deleted successfully",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
