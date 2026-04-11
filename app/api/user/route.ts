import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { verifyToken } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(req: Request): Promise<NextResponse> {
  try {
    await connectDB();

    const authHeader = req.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const token = authHeader.split(" ")[1];

    const decoded = verifyToken(token);

    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }

    const user = await User.findById(decoded.userId).select(
      "_id email balance role name country profileImage notifications isVerified createdAt"
    );

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // ✅ FIXED RESPONSE STRUCTURE
    return NextResponse.json({
      user: {
        _id: user._id.toString(),
        email: user.email,
        balance: user.balance ?? 0,
        role: user.role,
        name: user.name || "",
        country: user.country || "",
        profileImage: user.profileImage || "",
        notifications: user.notifications || {},
        isVerified: user.isVerified,
        createdAt: user.createdAt,
      },
    });

  } catch (error) {
    console.error("USER API ERROR:", error);

    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}