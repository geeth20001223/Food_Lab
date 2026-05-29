import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { email, roleType, otp, newPassword } = await req.json();

    // 1️⃣ Find user
    const [rows]: any = await db.execute(
      "SELECT * FROM users WHERE email = ? AND role = ?",
      [email, roleType],
    );
    const user = rows[0];
    if (!user)
      return NextResponse.json({ success: false, message: "User not found" });

    // 2️⃣ Check OTP and expiry
    if (user.otp !== otp || new Date() > new Date(user.otp_expiry))
      return NextResponse.json({
        success: false,
        message: "Invalid or expired OTP",
      });

    // 3️⃣ Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 4️⃣ Update password and clear OTP
    await db.execute(
      "UPDATE users SET password = ?, otp = NULL, otp_expiry = NULL WHERE email = ?",
      [hashedPassword, email],
    );

    return NextResponse.json({
      success: true,
      message: "Password reset successful",
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 },
    );
  }
}
