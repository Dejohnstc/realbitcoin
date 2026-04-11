import { connectDB } from "@/lib/mongodb";
import Deposit from "@/models/Deposit";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";

/* ================= GET ALL DEPOSITS (ADMIN ONLY) ================= */
export async function GET(req: Request): Promise<NextResponse> {
  try {
    await connectDB();

    // 🔐 ADMIN GUARD
    const auth = requireAdmin(req);

    if ("error" in auth) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status }
      );
    }

    const deposits = await Deposit.find()
      .sort({ createdAt: -1 });

    return NextResponse.json({ deposits });

  } catch (error) {
    console.error("DEPOSITS ERROR:", error);

    return NextResponse.json(
      { error: "Failed to fetch deposits" },
      { status: 500 }
    );
  }
}