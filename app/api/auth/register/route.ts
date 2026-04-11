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

    const existingUser = await User.findOne({ email });

    if (existingUser && existingUser.isVerified) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOTP();

    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    const user = await User.findOneAndUpdate(
      { email },
      {
        email,
        password: hashedPassword,
        otp,
        otpExpires,
        isVerified: false,
      },
      { upsert: true, new: true }
    );

    await sendOTP(email, otp);

    return NextResponse.json({
      message: "OTP sent to email",
      userId: user._id,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}