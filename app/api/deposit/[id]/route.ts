import { connectDB } from "@/lib/mongodb";
import Deposit from "@/models/Deposit";
import { verifyToken } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    // ✅ FIX HERE
    const { id } = await context.params;

    const token = req.headers.get("authorization")?.split(" ")[1];
    const decoded = verifyToken(token || "");

    if (!decoded) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const deposit = await Deposit.findById(id);

    if (!deposit) {
      return NextResponse.json(
        { error: "Deposit not found" },
        { status: 404 }
      );
    }

    if (deposit.userId.toString() !== decoded.userId) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      status: deposit.status,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed" },
      { status: 500 }
    );
  }
}