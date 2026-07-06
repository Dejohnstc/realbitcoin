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

    const totalSupply = coin.totalSupply || 0;
    const reservedSupply = coin.reservedSupply || 0;
    const salePrice = coin.salePrice || 0;

    const remainingSupply = Math.max(
      totalSupply - reservedSupply,
      0
    );

    const soldPercentage =
      totalSupply > 0
        ? Number(
            (
              (reservedSupply / totalSupply) *
              100
            ).toFixed(2)
          )
        : 0;

    const raised = Number(
      (reservedSupply * salePrice).toFixed(2)
    );

    return NextResponse.json({
      success: true,
      coin: {
        ...coin,
        remainingSupply,
        soldPercentage,
        raised,
        investors: coin.reservations,
      },
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "Server error.",
      },
      {
        status: 500,
      }
    );
  }
}