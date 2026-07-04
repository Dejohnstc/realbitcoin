import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import CoinListing from "@/models/CoinListing";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await connectDB();

    const { slug } = await params;

    const coin = await CoinListing.findOne({
      slug: slug.toLowerCase(),
      displayDashboard: true,
    }).lean();

    if (!coin) {
      return NextResponse.json(
        {
          success: false,
          message: "Coin not found.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      coin,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "Server error.",
      },
      { status: 500 }
    );
  }
}