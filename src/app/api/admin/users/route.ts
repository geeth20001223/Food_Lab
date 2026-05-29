import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

// ==============================
// GET - Fetch All Users
// ==============================
export async function GET() {
  try {
    const [rows]: any = await db.execute(
      "SELECT id, employee_name, employee_id, email, role, created_at FROM users ORDER BY created_at DESC",
    );

    return NextResponse.json(rows);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 },
    );
  }
}

// ==============================
// POST - Create User
// ==============================
export async function POST(req: Request) {
  try {
    const { employee_name, employee_id, email, role, password } =
      await req.json();

    if (!employee_name || !employee_id || !email || !role || !password) {
      return NextResponse.json(
        { success: false, message: "All fields are required" },
        { status: 400 },
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.execute(
      "INSERT INTO users (employee_name, employee_id, email, role, password, created_at) VALUES (?, ?, ?, ?, ?, NOW())",
      [employee_name, employee_id, email, role, hashedPassword],
    );

    return NextResponse.json({
      success: true,
      message: "User created successfully",
    });
  } catch (error: any) {
    if (error.code === "ER_DUP_ENTRY") {
      return NextResponse.json(
        { success: false, message: "User already exists" },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 },
    );
  }
}

// ==============================
// PUT - Update User
// ==============================
export async function PUT(req: Request) {
  try {
    const url = new URL(req.url);
    const id = parseInt(url.searchParams.get("id") || "", 10);

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Invalid ID" },
        { status: 400 },
      );
    }

    const { employee_name, employee_id, email, role, password } =
      await req.json();

    if (password && password.trim() !== "") {
      const hashedPassword = await bcrypt.hash(password, 10);

      await db.execute(
        "UPDATE users SET employee_name=?, employee_id=?, email=?, role=?, password=? WHERE id=?",
        [employee_name, employee_id, email, role, hashedPassword, id],
      );
    } else {
      await db.execute(
        "UPDATE users SET employee_name=?, employee_id=?, email=?, role=? WHERE id=?",
        [employee_name, employee_id, email, role, id],
      );
    }

    return NextResponse.json({
      success: true,
      message: "User updated successfully",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 },
    );
  }
}

// ==============================
// DELETE - Remove User
// ==============================
export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const id = parseInt(url.searchParams.get("id") || "", 10);

    const [result]: any = await db.execute("DELETE FROM users WHERE id=?", [
      id,
    ]);

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 },
    );
  }
}
