import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth";

import CoinReservation from "@/models/CoinReservation";
import CoinListing from "@/models/CoinListing";
import Portfolio from "@/models/portfolio";

export async function POST(req: NextRequest) {
  await connectDB();

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const authHeader = req.headers.get("authorization");

    if (!authHeader) {
      throw new Error("Unauthorized");
    }

    const token = authHeader.split(" ")[1];

    const decoded = verifyToken(token);

    if (!decoded?.userId) {
      throw new Error("Invalid token");
    }

    const { reservationId } = await req.json();

    const reservation = await CoinReservation.findOne({
      _id: reservationId,
      userId: decoded.userId,
    }).session(session);

    if (!reservation) {
      throw new Error("Reservation not found.");
    }

    if (reservation.claimed) {
      throw new Error("Tokens already claimed.");
    }

    const coin = await CoinListing.findById(
      reservation.coinId
    ).session(session);

    if (!coin) {
      throw new Error("Coin not found.");
    }

    if (!coin.claimEnabled) {
      throw new Error(
        "Claiming has not been enabled yet."
      );
    }

    const existing = await Portfolio.findOne({
      userId: decoded.userId,
      assetSymbol: coin.symbol,
    }).session(session);

    if (existing) {
      existing.amount += reservation.coinsPurchased;
      existing.currentPrice = coin.currentPrice;
      existing.averageBuyPrice = reservation.salePrice;

      await existing.save({
        session,
      });
    } else {
      await Portfolio.create(
        [
          {
            userId: decoded.userId,

            assetSymbol: coin.symbol,

            assetName: coin.name,

            logo: coin.logo,

            amount:
              reservation.coinsPurchased,

            averageBuyPrice:
              reservation.salePrice,

            currentPrice:
              coin.currentPrice,

            isLaunchToken: true,
          },
        ],
        {
          session,
        }
      );
    }

    reservation.claimed = true;

    reservation.status = "claimed";

    await reservation.save({
      session,
    });

    await session.commitTransaction();

    return NextResponse.json({
      success: true,
      message:
        "Tokens claimed successfully.",
    });

  } catch (error) {
    await session.abortTransaction();

    const message =
      error instanceof Error
        ? error.message
        : "Unable to claim tokens.";

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