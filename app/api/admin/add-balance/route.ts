import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { verifyToken } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request): Promise<NextResponse> {
  await connectDB();

  const token = req.headers.get("authorization")?.split(" ")[1];
  const decoded = verifyToken(token || "");

  const admin = await User.findById(decoded?.userId);

  if (!admin || admin.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId, amount } = await req.json();

  await User.findByIdAndUpdate(userId, {
    $inc: { balance: amount },
  });

  return NextResponse.json({ message: "Balance updated" });
}