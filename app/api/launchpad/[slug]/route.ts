import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";

import CoinListing from "@/models/CoinListing";
import CoinReservation from "@/models/CoinReservation";
import User from "@/models/User";
type PopulatedUser = {
  name?: string;
};

type ReservationResult = {
  coinsPurchased: number;
  totalPaid: number;
  createdAt: Date;
  userId: PopulatedUser | null;
};
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await connectDB();

    const { slug } = await params;

    const coin = await CoinListing.findOne({
      slug: slug.toLowerCase(),
    });

    if (!coin) {
      return NextResponse.json(
        {
          success: false,
          message: "Coin not found.",
        },
        {
          status: 404,
        }
      );
    }

    const reservations = await CoinReservation.find({
      coinId: coin._id,
      status: "reserved",
    })
      .populate("userId", "firstName lastName username")
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

  const recent = (reservations as ReservationResult[]).map((item) => {
  const user = item.userId;

  let displayName = "Anonymous";

  if (user?.name && user.name.trim()) {
    const parts = user.name.trim().split(" ");

    if (parts.length > 1) {
      displayName = `${parts[0]} ${parts[1].charAt(0)}.`;
    } else {
      displayName = parts[0];
    }
  }

  return {
    user: displayName,
    coins: item.coinsPurchased,
    amount: item.totalPaid,
    createdAt: item.createdAt,
  };
});

    return NextResponse.json({
      success: true,
      reservations: recent,
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