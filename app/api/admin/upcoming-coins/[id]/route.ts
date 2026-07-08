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
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;

    const coin = await CoinListing.findByIdAndDelete(id);

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
      message: "Listing deleted successfully.",
    });

  } catch (error) {
    console.error("DELETE COIN ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to delete listing.",
      },
      {
        status: 500,
      }
    );
  }
}