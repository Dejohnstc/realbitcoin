import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";

import { connectDB } from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth";

import CoinListing from "@/models/CoinListing";
import CoinReservation from "@/models/CoinReservation";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

void CoinListing;



    const authHeader = req.headers.get("authorization");

    if (!authHeader) {
      return NextResponse.json(
        { success: false },
        { status: 401 }
      );
    }

    const token = authHeader.split(" ")[1];

    const decoded = verifyToken(token);

    if (!decoded?.userId) {
      return NextResponse.json(
        { success: false },
        { status: 401 }
      );
    }

    // ================= DEBUG =================
   
    const reservations = await CoinReservation.find({
      userId: decoded.userId,
    })
      .populate({
  path: "coinId",
  model: CoinListing,
  select:
    "name symbol logo listingDate currentPrice claimEnabled",
})
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      reservations,
    });

  } catch (error) {
    console.error("LAUNCHPAD ASSETS ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load launchpad holdings.",
      },
      {
        status: 500,
      }
    );
  }
}