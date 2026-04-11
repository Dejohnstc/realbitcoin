import { connectDB } from "@/lib/mongodb";
import Deposit from "@/models/Deposit";
import { verifyToken } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(req: Request): Promise<NextResponse> {
  await connectDB();

  const token = req.headers.get("authorization")?.split(" ")[1];
  const decoded = verifyToken(token || "");

  const deposits = await Deposit.find({
    userId: decoded?.userId,
  }).sort({ createdAt: -1 });

  return NextResponse.json({ deposits });
}