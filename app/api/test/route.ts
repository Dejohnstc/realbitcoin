import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { NextResponse } from "next/server";

export async function GET(): Promise<NextResponse> {
  await connectDB();

  const user = await User.create({
    email: "realtest@gmail.com",
    password: "123456",
  });

  return NextResponse.json({
    message: "User created",
    user,
  });
}