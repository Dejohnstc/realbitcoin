import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth";

import CoinReservation from "@/models/CoinReservation";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const authHeader = req.headers.get("authorization");

    if (!authHeader) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const token = authHeader.split(" ")[1];

    const decoded = verifyToken(token);

    if (!decoded?.userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid token",
        },
        { status: 401 }
      );
    }

    const reservations = await CoinReservation.find({
      userId: decoded.userId,
    })
     .populate({
  path: "coinId",
  select:
    "name symbol logo listingDate claimEnabled currentPrice",
})
      .sort({
        createdAt: -1,
      });

    return NextResponse.json({
      success: true,
      reservations,
    });

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load reservations.",
      },
      {
        status: 500,
      }
    );
  }
}