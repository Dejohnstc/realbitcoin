import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import CoinListing from "@/models/CoinListing";
import CoinReservation from "@/models/CoinReservation";

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
const reservations = await CoinReservation.find({
  coinId: coin._id,
  status: "reserved",
});

const investors = reservations.length;

const reservedSupply = reservations.reduce(
  (total, reservation) =>
    total + reservation.coinsPurchased,
  0
);

const totalSupply = coin.totalSupply || 0;

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
        ).toFixed(4)
      )
    : 0;

const raised = Number(
  reservations
    .reduce(
      (total, reservation) =>
        total + reservation.totalPaid,
      0
    )
    .toFixed(2)
);

    return NextResponse.json({
      success: true,
      coin: {
  ...coin,
  reservedSupply,
  remainingSupply,
  soldPercentage,
  raised,
  investors,
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