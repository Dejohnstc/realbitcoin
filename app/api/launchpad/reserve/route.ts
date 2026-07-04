import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth";

import User from "@/models/User";
import CoinListing from "@/models/CoinListing";
import CoinReservation from "@/models/CoinReservation";

export async function POST(req: NextRequest) {
  const session = await mongoose.startSession();

  try {
    await connectDB();

    session.startTransaction();

    const authHeader = req.headers.get("authorization");

    if (!authHeader) {
      await session.abortTransaction();

      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const token = authHeader.split(" ")[1];

    const decoded = verifyToken(token);

    if (!decoded?.userId) {
      await session.abortTransaction();

      return NextResponse.json(
        {
          success: false,
          message: "Invalid token.",
        },
        { status: 401 }
      );
    }

    const {
      coinId,
      coinsPurchased,
    } = await req.json();

    const user = await User.findById(
      decoded.userId
    ).session(session);

    const coin = await CoinListing.findById(
      coinId
    ).session(session);

    if (!user || !coin) {
      await session.abortTransaction();

      return NextResponse.json(
        {
          success: false,
          message: "Launch not found.",
        },
        { status: 404 }
      );
    }

    if (!coin.reservationEnabled) {
      await session.abortTransaction();

      return NextResponse.json(
        {
          success: false,
          message: "Reservations are disabled.",
        },
        { status: 400 }
      );
    }

    const totalCost =
      coinsPurchased * coin.salePrice;

    if (
      coinsPurchased < coin.minPurchase
    ) {
      await session.abortTransaction();

      return NextResponse.json(
        {
          success: false,
          message:
            "Below minimum purchase.",
        },
        { status: 400 }
      );
    }

    if (
      coinsPurchased > coin.maxPurchase
    ) {
      await session.abortTransaction();

      return NextResponse.json(
        {
          success: false,
          message:
            "Maximum purchase exceeded.",
        },
        { status: 400 }
      );
    }

    const remaining =
      coin.totalSupply -
      coin.reservedSupply;

    if (
      coinsPurchased > remaining
    ) {
      await session.abortTransaction();

      return NextResponse.json(
        {
          success: false,
          message:
            "Not enough remaining supply.",
        },
        { status: 400 }
      );
    }

    if (
      user.balance < totalCost
    ) {
      await session.abortTransaction();

      return NextResponse.json(
        {
          success: false,
          message:
            "Insufficient balance. Please deposit.",
        },
        { status: 400 }
      );
    }

    user.balance -= totalCost;

    coin.reservedSupply +=
      coinsPurchased;

    coin.reservations += 1;

    await user.save({
      session,
    });

    await coin.save({
      session,
    });

    const existingReservation = await CoinReservation.findOne({
  userId: user._id,
  coinId: coin._id,
}).session(session);

if (existingReservation) {
  existingReservation.coinsPurchased += coinsPurchased;
  existingReservation.totalPaid += totalCost;
  existingReservation.salePrice = coin.salePrice;

  await existingReservation.save({
    session,
  });
} else {
  await CoinReservation.create(
    [
      {
        userId: user._id,

        coinId: coin._id,

        coinsPurchased,

        salePrice: coin.salePrice,

        totalPaid: totalCost,

        status: "reserved",

        claimed: false,
      },
    ],
    {
      session,
    }
  );
}
    

    await session.commitTransaction();

    return NextResponse.json({
      success: true,

      balance: user.balance,

      reservedSupply:
        coin.reservedSupply,

      message:
        "Allocation reserved successfully.",
    });

  } catch (error) {

    await session.abortTransaction();

    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message:
          "Reservation failed.",
      },
      {
        status: 500,
      }
    );

  } finally {

    session.endSession();

  }
}