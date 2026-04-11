import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { sendWelcomeEmail } from "@/lib/mail";
import { NextResponse } from "next/server";

interface VerifyBody {
  email: string;
  otp: string;
}

export async function POST(req: Request): Promise<NextResponse> {
  try {
    await connectDB();

    const { email, otp }: VerifyBody = await req.json();

    // ✅ FIX 1: normalize email (CRITICAL)
    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // ✅ prevent re-verification spam
    if (user.isVerified) {
      return NextResponse.json({
        message: "Account already verified",
      });
    }

    // ✅ FIX 2: trim OTP (handles spaces from input)
    const cleanOtp = otp.trim();

    if (
      !user.otp ||
      !user.otpExpires ||
      user.otp !== cleanOtp ||
      user.otpExpires.getTime() < Date.now()
    ) {
      return NextResponse.json(
        { error: "Invalid or expired OTP" },
        { status: 400 }
      );
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;

    await user.save();

    if (!user.email) {
      return NextResponse.json(
        { error: "User email missing" },
        { status: 400 }
      );
    }

    // 🔥 SAFE EMAIL SEND (non-blocking logic)
    try {
      await sendWelcomeEmail(user.email);
      console.log("✅ Welcome email sent to:", user.email);
    } catch (mailError) {
      console.error("❌ Welcome email failed:", mailError);
    }

    return NextResponse.json({
      message: "Account verified successfully",
    });

  } catch (error) {
    console.error("VERIFY ERROR:", error);

    return NextResponse.json(
      { error: "Verification failed" },
      { status: 500 }
    );
  }
}