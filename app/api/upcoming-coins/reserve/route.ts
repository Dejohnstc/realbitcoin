import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth";

import User from "@/models/User";
import CoinListing from "@/models/CoinListing";
import CoinReservation from "@/models/CoinReservation";

export async function POST(req: NextRequest) {
  await connectDB();

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const authHeader = req.headers.get("authorization");
console.log("AUTH HEADER:", authHeader);
    if (!authHeader) {
      throw new Error("Unauthorized");
    }

    const token = authHeader.split(" ")[1];
console.log("TOKEN:", token);
    const decoded = verifyToken(token);
console.log("DECODED:", decoded);
    if (!decoded?.userId) {
      throw new Error("Invalid token");
    }

    const { coinId, coinsPurchased } = await req.json();

    if (!coinId || !coinsPurchased) {
      throw new Error("Missing reservation information.");
    }

    const user = await User.findById(decoded.userId).session(session);

    if (!user) {
      throw new Error("User not found.");
    }

    const coin = await CoinListing.findById(coinId).session(session);

    if (!coin) {
      throw new Error("Coin not found.");
    }

    if (!coin.reservationEnabled) {
      throw new Error("Reservations are currently closed.");
    }

    if (
      coinsPurchased < coin.minPurchase ||
      coinsPurchased > coin.maxPurchase
    ) {
      throw new Error(
        `Purchase must be between ${coin.minPurchase} and ${coin.maxPurchase} ${coin.symbol}.`
      );
    }

    const remainingSupply =
      coin.totalSupply - coin.reservedSupply;

    if (coinsPurchased > remainingSupply) {
      throw new Error("Insufficient remaining supply.");
    }

    const totalCost =
      coinsPurchased * coin.salePrice;

    if (user.balance < totalCost) {
      throw new Error("Insufficient balance.");
    }

    const existing =
      await CoinReservation.findOne({
        userId: user._id,
        coinId: coin._id,
        status: "reserved",
      }).session(session);

    if (existing) {
      throw new Error(
        "You already have an active reservation."
      );
    }

    user.balance -= totalCost;
    user.lockedBalance += totalCost;

    await user.save({ session });

    coin.reservedSupply += coinsPurchased;
    coin.reservations += 1;

    await coin.save({ session });

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

    await session.commitTransaction();

    return NextResponse.json({
      success: true,
      message: "Reservation successful.",
      balance: user.balance,
      lockedBalance: user.lockedBalance,
      reservedSupply: coin.reservedSupply,
    });

  } catch (error) {
    await session.abortTransaction();

   console.error("RESERVE ERROR:", error);

const message =
  error instanceof Error
    ? error.message
    : "Reservation failed.";

return NextResponse.json(
  {
    success: false,
    message,
  },
  {
    status: 400,
  }
);
  } finally {
    session.endSession();
  }
}