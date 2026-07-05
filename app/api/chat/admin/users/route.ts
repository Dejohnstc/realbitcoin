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
      // 🔥 NORMALIZE chatId / userId
      {
        $addFields: {
          effectiveChatId: {
            $ifNull: ["$chatId", "$userId"],
          },
        },
      },

      { $sort: { createdAt: -1 } },

      // 🔥 GROUP BY USER
      {
        $group: {
          _id: "$effectiveChatId",
          lastMessage: { $first: "$message" },
          lastTime: { $first: "$createdAt" },

          // 🔥 UNREAD COUNT (ADMIN SIDE)
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

      // 🔥 CONVERT TO OBJECTID (CRITICAL FIX)
      {
        $addFields: {
          userObjectId: {
            $cond: [
              { $eq: [{ $type: "$_id" }, "objectId"] },
              "$_id",
              {
                $convert: {
                  input: "$_id",
                  to: "objectId",
                  onError: null,
                  onNull: null,
                },
              },
            ],
          },
        },
      },

      // 🔥 JOIN USERS COLLECTION
      {
        $lookup: {
          from: "users",
          localField: "userObjectId",
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

      // 🔥 FINAL SHAPE
      {
        $project: {
          _id: 1,
          lastMessage: 1,
          lastTime: 1,
          unread: 1,

          email: "$userData.email",
          name: "$userData.name",
          profileImage: "$userData.profileImage",
        },
      },

      { $sort: { lastTime: -1 } },
    ]);

    

    return NextResponse.json({ users });

  } catch (error) {
    console.error("❌ ADMIN USERS ERROR:", error);

    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}