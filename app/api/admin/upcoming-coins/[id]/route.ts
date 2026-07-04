import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import CoinListing from "@/models/CoinListing";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;

    const body = await req.json();

    const coin = await CoinListing.findByIdAndUpdate(
      id,
      {
        $set: body,
      },
      {
        new: true,
      }
    );

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

    return NextResponse.json({
      success: true,
      coin,
    });

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to update listing.",
      },
      {
        status: 500,
      }
    );
  }
}