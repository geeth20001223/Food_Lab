import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  try {
    const { email, roleType } = await req.json();

    // 1️⃣ Find user
    const [rows]: any = await db.execute(
      "SELECT * FROM users WHERE email = ? AND role = ?",
      [email, roleType],
    );
    const user = rows[0];
    if (!user)
      return NextResponse.json({ success: false, message: "User not found" });

    // 2️⃣ Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000); // 6-digit
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    // 3️⃣ Save OTP in DB
    await db.execute(
      "UPDATE users SET otp = ?, otp_expiry = ? WHERE email = ?",
      [otp, otpExpiry, email],
    );

    // 4️⃣ Send email
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Food Lab System" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "Your OTP for Password Reset",
      html: `<p>Your OTP is: <b>${otp}</b></p><p>Expires in 10 minutes</p>`,
    });

    return NextResponse.json({
      success: true,
      message: "OTP sent to your email!",
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 },
    );
  }
}
