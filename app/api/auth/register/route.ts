import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { sendOTP } from "@/lib/mail";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: Request): Promise<NextResponse> {
  try {
    await connectDB();

    const { email, password }: { email: string; password: string } =
      await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // ✅ FIX 1: normalize email (CRITICAL)
    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({ email: normalizedEmail });

    // ✅ FIX 2: allow resend if NOT verified
    if (existingUser && existingUser.isVerified) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOTP();

    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    // ✅ FIX 3: always update same normalized email
    const user = await User.findOneAndUpdate(
      { email: normalizedEmail },
      {
        email: normalizedEmail,
        password: hashedPassword,
        otp,
        otpExpires,
        isVerified: false,
      },
      { upsert: true, new: true }
    );

    // ✅ FIX 4: send to normalized email
    await sendOTP(normalizedEmail, otp);

    console.log("✅ OTP SENT TO:", normalizedEmail);

    return NextResponse.json({
      message: "OTP sent to email",
      userId: user._id,
    });

  } catch (error) {
    console.error("❌ REGISTER ERROR:", error);

    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}