import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";

import CoinListing from "@/models/CoinListing";
import CoinReservation from "@/models/CoinReservation";
import User from "@/models/User";

type PopulatedUser = {
  name?: string;
};

type BuyerResult = {
  coinsPurchased: number;
  totalPaid: number;
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
        },
        {
          status: 404,
        }
      );
    }

   const buyers = (await CoinReservation.find({
  coinId: coin._id,
  status: "reserved",
})
  .populate("userId", "name")
  .sort({
    totalPaid: -1,
    createdAt: -1,
  })
  .limit(5)
  .lean()) as BuyerResult[];

    return NextResponse.json({
      success: true,
      buyers: buyers.map((item) => {
        let name = "Anonymous";

        if (
          item.userId?.name &&
          item.userId.name.trim()
        ) {
          const parts = item.userId.name
            .trim()
            .split(" ");

          name =
            parts.length > 1
              ? `${parts[0]} ${parts[1][0]}.`
              : parts[0];
        }

        return {
          user: name,
          coins: item.coinsPurchased,
          amount: item.totalPaid,
        };
      }),
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        buyers: [],
      },
      {
        status: 500,
      }
    );
  }
}