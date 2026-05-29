import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const id = searchParams.get("id");
    const list = searchParams.get("list");

    try {
        const search = searchParams.get("search");

        if (id) {
            // Fetch lab analysis joined with basic registration data
            const [rows]: any = await db.query(
                `SELECT a.*, 
                 r.sample_date, r.collection_time, r.sample_number, r.reference_number, 
                 r.sample_type, r.phi_area, r.moh_area, r.analysis_details, r.handed_over_by
                 FROM food_registering r 
                 LEFT JOIN lab_analysis a ON a.food_register_id = r.id
                 WHERE r.id = ?`,
                [id]
            );

            // Return the first row found (will have analysis data AND registration data)
            return NextResponse.json((rows as any[])[0] || null);
        } else if (list) {
            const [rows] = await db.query(
                `SELECT a.*, r.sample_number, r.sample_type 
                 FROM lab_analysis a
                 JOIN food_registering r ON a.food_register_id = r.id
                 ORDER BY a.updated_at DESC`
            );
            return NextResponse.json(rows);
        } else if (search) {
            const [rows] = await db.query(
                "SELECT id, sample_number, sample_type FROM food_registering WHERE sample_number LIKE ? ORDER BY id DESC LIMIT 20",
                [`%${search}%`]
            );
            return NextResponse.json(rows);
        } else if (type) {
            const [rows] = await db.query(
                "SELECT id, sample_number, sample_type FROM food_registering WHERE sample_type = ? ORDER BY id DESC",
                [type]
            );
            return NextResponse.json(rows);
        }
        return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    } catch (error: any) {
        console.error("[GET api/analyst] Database error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        if (!body.food_register_id) {
            return NextResponse.json({ error: "food_register_id is required" }, { status: 400 });
        }

        // List of valid columns in lab_analysis (to avoid errors from extra body fields)
        const VALID_COLUMNS = [
            'food_register_id', 'sample_type',
            'moist_m1_i', 'moist_m2_i', 'moist_m3_i', 'moist_m1_ii', 'moist_m2_ii', 'moist_m3_ii',
            'ash_m1_i', 'ash_m2_i', 'ash_m3_i', 'ash_m1_ii', 'ash_m2_ii', 'ash_m3_ii',
            'acid_m1_i', 'acid_m2_i', 'acid_m1_ii', 'acid_m2_ii',
            'microscope_notes', 'analyzed_by', 'analyzed_date', 'checked_by', 'checked_date',
            'revision_no', 'issue_no', 'date_of_revision', 'date_of_issue', 'analysis_complete'
        ];

        const [existing] = await db.query(
            "SELECT id FROM lab_analysis WHERE food_register_id = ?",
            [body.food_register_id]
        );

        const dataToSave: any = {};
        VALID_COLUMNS.forEach(col => {
            if (body[col] !== undefined) {
                // Convert booleans to 1/0 for tinyint
                if (col === 'analysis_complete') {
                    dataToSave[col] = body[col] ? 1 : 0;
                } else {
                    dataToSave[col] = body[col];
                }
            }
        });

        if ((existing as any[]).length > 0) {
            // Update
            const fields = Object.keys(dataToSave).filter(k => k !== 'food_register_id');
            const setClause = fields.map(f => `${f} = ?`).join(', ');
            const values = fields.map(f => dataToSave[f]);

            await db.query(
                `UPDATE lab_analysis SET ${setClause}, updated_at = NOW() WHERE food_register_id = ?`,
                [...values, body.food_register_id]
            );
        } else {
            // Insert
            const fields = Object.keys(dataToSave);
            const columns = fields.join(', ');
            const placeholders = fields.map(() => '?').join(', ');
            const values = fields.map(f => dataToSave[f]);

            await db.query(
                `INSERT INTO lab_analysis (${columns}, updated_at) VALUES (${placeholders}, NOW())`,
                values
            );
        }

        return NextResponse.json({ success: true, message: "Analysis saved successfully" });
    } catch (error: any) {
        console.error("[POST api/analyst] Database error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const body = await req.json();
        if (!body.food_register_id) {
            return NextResponse.json({ error: "food_register_id is required" }, { status: 400 });
        }

        await db.query(
            "DELETE FROM lab_analysis WHERE food_register_id = ?",
            [body.food_register_id]
        );

        return NextResponse.json({ success: true, message: "Analysis deleted successfully" });
    } catch (error: any) {
        console.error("[DELETE api/analyst] Database error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
