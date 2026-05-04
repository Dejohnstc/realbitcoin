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

    // ✅ normalize email
    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // ✅ prevent re-verification
    if (user.isVerified) {
      return NextResponse.json({
        message: "Account already verified",
      });
    }

    // ✅ clean OTP
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

    // ✅ VERIFY USER
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

    // 🔥 NON-BLOCKING EMAIL (BEST PRACTICE)
    sendWelcomeEmail(user.email)
      .then(() => {
        console.log("✅ Welcome email sent to:", user.email);
      })
      .catch((err) => {
        console.error("❌ Welcome email failed:", err);
      });

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