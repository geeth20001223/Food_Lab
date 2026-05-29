import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";

export async function POST(req: Request) {

  try {
    const body = await req.json();
    const { action } = body;

    // ===========================

    // ===========================
    // 🔹 LOGIN
    // ===========================
    if (action === "login") {
      const { roleType, usernameOrId, password } = body;

      let query: string;
      let params: any[];

      if (roleType === "Admin") {
        query = "SELECT * FROM admin WHERE username = ?";
        params = [usernameOrId];
      } else {
        query = "SELECT * FROM users WHERE employee_id = ? AND role = ?";
        params = [usernameOrId, roleType];
      }

      const [rows] = await db.execute<any[]>(query, params);

      if (rows.length === 0) {
        return NextResponse.json(
          { success: false, message: roleType === "Admin" ? "Admin not found" : "User not found" },
          { status: 401 }
        );
      }

      const user = rows[0];
      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return NextResponse.json(
          { success: false, message: "Incorrect password" },
          { status: 401 }
        );
      }

      return NextResponse.json({
        success: true,
        user: roleType === "Admin"
          ? { id: user.id, username: user.username, role: "Admin" }
          : { id: user.id, employee_id: user.employee_id, role: user.role },
      });
    }

    // ===========================
    // 🔹 FORGOT PASSWORD (SEND OTP)
    // ===========================
    if (action === "forgot") {
      const { email, roleType } = body;
      const table = roleType === "Admin" ? "admin" : "users";

      const [rows] = await db.execute<any[]>(
        `SELECT * FROM ${table} WHERE email = ?`,
        [email]
      );

      if (rows.length === 0) {
        return NextResponse.json(
          { success: false, message: "Email not found" },
          { status: 404 }
        );
      }

      // Generate OTP & expiry (MySQL DATETIME format)
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiry = new Date(Date.now() + 5 * 60 * 1000)
        .toISOString()
        .slice(0, 19)
        .replace("T", " ");

      await db.execute(
        `UPDATE ${table} SET otp = ?, otp_expiry = ? WHERE email = ?`,
        [otp, expiry, email]
      );

      // Send OTP via Gmail
      try {
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: "yourgmail@gmail.com",       // ✅ Replace with your Gmail
            pass: "your-app-password",         // ✅ Replace with Gmail App Password
          },
        });

        const info = await transporter.sendMail({
          from: "yourgmail@gmail.com",
          to: email,
          subject: "Food Lab System - OTP",
          text: `Your OTP is ${otp}. It expires in 5 minutes.`,
        });

        console.log(`OTP email sent to ${email}: ${info.response}`);
      } catch (emailError: any) {
        console.error("Gmail sending error:", emailError.response || emailError.message || emailError);
        return NextResponse.json(
          { success: false, message: `Failed to send OTP: ${emailError.message}` },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "OTP sent to email successfully",
      });
    }

    // ===========================
    // 🔹 RESET PASSWORD
    // ===========================
    if (action === "reset") {
      const { email, roleType, otp, newPassword } = body;
      const table = roleType === "Admin" ? "admin" : "users";

      const [rows] = await db.execute<any[]>(
        `SELECT * FROM ${table} WHERE email = ?`,
        [email]
      );

      if (rows.length === 0) {
        return NextResponse.json(
          { success: false, message: "User not found" },
          { status: 404 }
        );
      }

      const user = rows[0];

      if (!user.otp || user.otp !== otp || new Date(user.otp_expiry) < new Date()) {
        return NextResponse.json(
          { success: false, message: "Invalid or expired OTP" },
          { status: 400 }
        );
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await db.execute(
        `UPDATE ${table} 
         SET password = ?, otp = NULL, otp_expiry = NULL 
         WHERE email = ?`,
        [hashedPassword, email]
      );

      return NextResponse.json({
        success: true,
        message: "Password reset successful",
      });
    }

    // ===========================
    // 🔹 INVALID ACTION
    // ===========================
    return NextResponse.json(
      { success: false, message: "Invalid action" },
      { status: 400 }
    );

  } catch (error) {
    console.error("Server Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
