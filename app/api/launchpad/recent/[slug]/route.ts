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

    const reservations = (await CoinReservation.find({
  coinId: coin._id,
  status: "reserved",
})
  .populate("userId", "name")
  .sort({
    totalPaid: -1,
    createdAt: -1,
  })
  .limit(5)
  .lean()) as ReservationResult[];

    const recent = reservations.map((item) => {
      let displayName = "Anonymous";

      if (
        item.userId?.name &&
        item.userId.name.trim()
      ) {
        const parts = item.userId.name
          .trim()
          .split(" ");

        displayName =
          parts.length > 1
            ? `${parts[0]} ${parts[1][0]}.`
            : parts[0];
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
        reservations: [],
      },
      {
        status: 500,
      }
    );
  }
}