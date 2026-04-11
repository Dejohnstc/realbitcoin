import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { verifyToken } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    await connectDB();

    const token = req.headers.get("authorization")?.split(" ")[1];
    const decoded = verifyToken(token || "");

    if (!decoded?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { profileImage } = await req.json();

    const user = await User.findByIdAndUpdate(
      decoded.userId,
      { profileImage },
      { new: true }
    );

    return NextResponse.json({
      success: true,
      profileImage: user?.profileImage,
    });

  } catch (error) {
    console.error("UPDATE PROFILE ERROR:", error);

    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}