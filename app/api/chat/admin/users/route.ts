import { connectDB } from "@/lib/mongodb";
import Chat from "@/models/Chat";
import { verifyToken } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    await connectDB();

    const token = req.headers.get("authorization")?.split(" ")[1];
    const decoded = verifyToken(token || "");

    if (!decoded || typeof decoded.userId !== "string") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const users = await Chat.aggregate([
      {
        $addFields: {
          effectiveChatId: {
            $ifNull: ["$chatId", "$userId"],
          },
        },
      },

      { $sort: { createdAt: -1 } },

      {
        $group: {
          _id: "$effectiveChatId",
          lastMessage: { $first: "$message" },
          lastTime: { $first: "$createdAt" },
          unread: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$sender", "user"] },
                    { $eq: ["$read", false] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },

      // 🔥 JOIN USER COLLECTION
      {
        $lookup: {
          from: "users", // ⚠️ must match Mongo collection name
          localField: "_id",
          foreignField: "_id",
          as: "userData",
        },
      },

      {
        $unwind: {
          path: "$userData",
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $project: {
          _id: 1,
          lastMessage: 1,
          lastTime: 1,
          unread: 1,
          email: "$userData.email", // ✅ THIS IS THE FIX
        },
      },

      { $sort: { lastTime: -1 } },
    ]);

    console.log("✅ USERS WITH EMAIL:", users.length);

    return NextResponse.json({ users });

  } catch (error) {
    console.error("❌ ADMIN USERS ERROR:", error);

    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}