import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";
import { sendLoginAlertEmail } from "@/lib/mail";

interface LoginBody {
  email: string;
  password: string;
}

export async function POST(req: Request): Promise<NextResponse> {
  try {
    await connectDB();

    const { email, password }: LoginBody = await req.json();

    if (!email?.trim() || !password?.trim()) {
      return NextResponse.json(
        { error: "All fields are required." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail,
    }).lean(false);

    if (!user || !user.password) {
      return NextResponse.json(
        { error: "Invalid credentials." },
        { status: 400 }
      );
    }

    if (!user.isVerified) {
      return NextResponse.json(
        { error: "Please verify your account before logging in." },
        { status: 400 }
      );
    }

    const isMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!isMatch) {
      return NextResponse.json(
        { error: "Invalid credentials." },
        { status: 400 }
      );
    }

    const token = jwt.sign(
      {
        userId: user._id.toString(),
        role: user.role,
      },
      process.env.JWT_SECRET as string,
      {
        expiresIn: "7d",
      }
    );

    // Fire-and-forget login notification
    // ===========================
// SEND LOGIN ALERT
// ===========================

try {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "Unknown";

  const device =
    req.headers.get("user-agent") || "Unknown Device";

  const location = "Unknown";

  await sendLoginAlertEmail(
    user.email,
    device,
    ip,
    location
  );
} catch (error) {
  console.error(
    "Login alert email failed:",
    error
  );
}
    return NextResponse.json({
      success: true,
      message: "Login successful.",
      token,
      user: {
        id: user._id,
        name:
          user.name ||
          user.email.split("@")[0],
        email: user.email,
        balance: user.balance,
        role: user.role,
      },
    });

  } catch (error) {
    console.error("LOGIN ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Login failed.",
      },
      {
        status: 500,
      }
    );
  }
}