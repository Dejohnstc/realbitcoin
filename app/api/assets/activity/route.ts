import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";

import { connectDB } from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth";

import CoinListing from "@/models/CoinListing";
import Investment from "@/models/Investment";
import CoinReservation from "@/models/CoinReservation";

type Activity = {
  type: "investment" | "launchpad";
  title: string;
  amount: number;
  date: Date;
};

type PopulatedReservation = {
  totalPaid: number;
  createdAt: Date;
  coinId: {
    name: string;
  };
};

export async function GET(req: NextRequest) {
  try {
    await connectDB();

void CoinListing;

console.log(
  "After loading CoinListing:",
  mongoose.modelNames()
);
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

    const investments = await Investment.find({
      userId: decoded.userId,
    })
      .sort({ createdAt: -1 })
      .limit(10);

    // ================= DEBUG =================
    console.log("========== MONGOOSE DEBUG ==========");
    console.log("Registered models:", mongoose.modelNames());

    const coinIdPath = CoinReservation.schema.path("coinId");

    console.log("coinId path:", coinIdPath?.instance);
console.log("coinId options:", coinIdPath?.options);

    console.log(
      "CoinListing registered:",
      mongoose.models.CoinListing ? "YES" : "NO"
    );

    console.log("====================================");
    // =========================================

    const reservations = (await CoinReservation.find({
      userId: decoded.userId,
    })
      .populate({
  path: "coinId",
  model: CoinListing,
  select:
    "name symbol logo listingDate currentPrice claimEnabled",
})

      .sort({ createdAt: -1 })
      .limit(10)
      .lean()) as unknown as PopulatedReservation[];

    const activity: Activity[] = [
      ...investments.map((item) => ({
        type: "investment" as const,
        title: item.plan,
        amount: item.amount,
        date: item.createdAt,
      })),

      ...reservations
        .filter((item) => item.coinId)
        .map((item) => ({
          type: "launchpad" as const,
          title: item.coinId.name,
          amount: item.totalPaid,
          date: new Date(item.createdAt),
        })),
    ].sort(
      (a, b) => b.date.getTime() - a.date.getTime()
    );

    return NextResponse.json({
      success: true,
      activity,
    });

  } catch (error) {
    console.error("ACTIVITY API ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        activity: [],
      },
      {
        status: 500,
      }
    );
  }
}