import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { verifyToken } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request): Promise<NextResponse> {
  await connectDB();

  const token = req.headers.get("authorization")?.split(" ")[1];
  const decoded = verifyToken(token || "");

  if (!decoded) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { password } = await req.json();

  if (!password || password.length < 6) {
    return NextResponse.json(
      { error: "Password too short" },
      { status: 400 }
    );
  }

  const hashed = await bcrypt.hash(password, 10);

  await User.findByIdAndUpdate(decoded.userId, {
    password: hashed,
  });

  return NextResponse.json({ message: "Updated" });
}