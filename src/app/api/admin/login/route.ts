import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, email, password } = body;

    // Validate that we have a password and either username or email
    if (!password || (!username && !email)) {
      return NextResponse.json(
        { success: false, message: "Missing required credentials" },
        { status: 400 },
      );
    }

    let user = null;
    let userType = null;

    // Try admin login first if username is provided
    if (username) {
      const [adminRows]: any = await db.execute(
        "SELECT * FROM admin WHERE username = ?",
        [username],
      );

      if (adminRows.length > 0) {
        user = adminRows[0];
        userType = "admin";
      }
    }

    // Try user login if email is provided and admin not found
    if (!user && email) {
      const [userRows]: any = await db.execute(
        "SELECT * FROM users WHERE email = ?",
        [email],
      );

      if (userRows.length > 0) {
        user = userRows[0];
        userType = "user";
      }
    }

    // User not found
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 401 },
      );
    }

    // 🔐 Compare hashed password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return NextResponse.json(
        { success: false, message: "Incorrect password" },
        { status: 401 },
      );
    }

    // Login successful - return appropriate data based on user type
    if (userType === "admin") {
      return NextResponse.json({
        success: true,
        message: "Login successful",
        userType: "admin",
        admin: {
          id: user.id,
          username: user.username,
        },
      });
    } else {
      return NextResponse.json({
        success: true,
        message: "Login successful",
        userType: "user",
        user: {
          id: user.id,
          employee_name: user.employee_name,
          employee_id: user.employee_id,
          email: user.email,
          role: user.role,
        },
      });
    }
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 },
    );
  }
}
