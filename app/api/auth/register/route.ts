import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { sendOTP } from "@/lib/mail";
import bcrypt from "bcryptjs";
import { randomInt } from "crypto";
import { NextResponse } from "next/server";

interface RegisterBody {
  name?: string;
  email?: string;
  country?: string;
  phone?: string;
  password?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds between code requests

// 🔐 cryptographically secure 6-digit OTP (not Math.random)
function generateOTP(): string {
  return randomInt(100000, 1000000).toString();
}

export async function POST(req: Request): Promise<NextResponse> {
  try {
    await connectDB();

    const body = (await req.json()) as RegisterBody;

    const name = (body.name || "").trim();
    const email = (body.email || "").trim().toLowerCase();
    const country = (body.country || "").trim();
    const phoneRaw = (body.phone || "").trim();
    const password = body.password || "";

    // 🔒 SERVER-SIDE VALIDATION (never trust the client)
    if (!name || name.length < 2) {
      return NextResponse.json(
        { error: "A valid full name is required" },
        { status: 400 }
      );
    }
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json(
        { error: "A valid email is required" },
        { status: 400 }
      );
    }
    if (!country) {
      return NextResponse.json(
        { error: "Country is required" },
        { status: 400 }
      );
    }

    const phoneDigits = phoneRaw.replace(/[^\d]/g, "");
    if (phoneDigits.length < 7 || phoneDigits.length > 15) {
      return NextResponse.json(
        { error: "A valid phone number is required" },
        { status: 400 }
      );
    }
    const phone = (phoneRaw.startsWith("+") ? "+" : "") + phoneDigits;

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const existingUser = await User.findOne({ email });

    // already registered AND verified → block
    if (existingUser && existingUser.isVerified) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // ⏳ throttle resend for unverified accounts (anti-spam)
    if (existingUser && existingUser.otpExpires) {
      const lastSent = existingUser.otpExpires.getTime() - OTP_TTL_MS;
      const sinceLast = Date.now() - lastSent;
      if (sinceLast < RESEND_COOLDOWN_MS) {
        const wait = Math.ceil((RESEND_COOLDOWN_MS - sinceLast) / 1000);
        return NextResponse.json(
          { error: `Please wait ${wait}s before requesting another code` },
          { status: 429 }
        );
      }
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + OTP_TTL_MS);

    const user = await User.findOneAndUpdate(
      { email },
      {
        name,
        email,
        country,
        phone,
        password: hashedPassword,
        otp,
        otpExpires,
        isVerified: false,
      },
      { upsert: true, new: true }
    );

   try {
  await sendOTP(email, otp);
} catch (error) {
  console.error("Failed to send OTP:", error);
}

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