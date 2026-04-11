import { connectDB } from "@/lib/mongodb";
import Withdraw from "@/models/Withdraw";
import { verifyToken } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(req: Request): Promise<NextResponse> {
  await connectDB();

  const token = req.headers.get("authorization")?.split(" ")[1];
  const decoded = verifyToken(token || "");

  if (!decoded) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const withdrawals = await Withdraw.find({
    userId: decoded.userId,
  }).sort({ createdAt: -1 });

  return NextResponse.json({ withdrawals });
}