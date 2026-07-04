import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import CoinListing from "@/models/CoinListing";

export async function GET() {
  try {
    await connectDB();

    const coins = await CoinListing.find({
      displayDashboard: true,
      status: {
        $ne: "cancelled",
      },
    })
      .sort({
        priority: -1,
        listingDate: 1,
      })
      .lean();

    return NextResponse.json({
      success: true,
      coins,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load upcoming listings.",
      },
      { status: 500 }
    );
  }
}