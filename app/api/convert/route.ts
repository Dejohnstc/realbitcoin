import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";

import { connectDB } from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth";
import { getMarkets } from "@/lib/market";

import User from "@/models/User";
import Portfolio from "@/models/portfolio";
import Conversion from "@/models/Conversion";

interface ConvertBody {
  symbol: string;
  usdAmount: number;
}

export async function POST(req: NextRequest) {
  const session = await mongoose.startSession();

  try {
    await connectDB();

    session.startTransaction();

        const authHeader = req.headers.get("authorization");

    if (!authHeader) {
      throw new Error("Unauthorized");
    }

    const token = authHeader.split(" ")[1];

    const decoded = verifyToken(token);

    if (!decoded?.userId) {
      throw new Error("Unauthorized");
    }
        const { symbol, usdAmount }: ConvertBody =
      await req.json();

    if (!symbol || usdAmount <= 0) {
      throw new Error("Invalid request.");
    }
        const user = await User.findById(
      decoded.userId
    ).session(session);

    if (!user) {
      throw new Error("User not found.");
    }

    if (user.balance < usdAmount) {
      throw new Error("Insufficient balance.");
    }

        const markets = await getMarkets();

    const market = markets.find(
      (item) =>
        item.symbol.toUpperCase() ===
        symbol.toUpperCase()
    );

    if (!market) {
      throw new Error("Asset not supported.");
    }

    const currentPrice = market.current_price;

    if (currentPrice <= 0) {
      throw new Error("Invalid market price.");
    }

    const coinsPurchased =
      usdAmount / currentPrice;
          let portfolio =
      await Portfolio.findOne({
        userId: user._id,
        assetSymbol:
          market.symbol.toUpperCase(),
      }).session(session);
          if (!portfolio) {
      portfolio = await Portfolio.create(
        [
          {
            userId: user._id,

            assetSymbol:
              market.symbol.toUpperCase(),

            assetName: market.name,

            logo: market.image,

            amount: coinsPurchased,

            averageBuyPrice:
              currentPrice,

            currentPrice,

            isLaunchToken: false,
          },
        ],
        { session }
      ).then((docs) => docs[0]);
    } else {
      const currentValue =
        portfolio.amount *
        portfolio.averageBuyPrice;

      const newValue =
        usdAmount;

      portfolio.averageBuyPrice =
        (currentValue + newValue) /
        (portfolio.amount +
          coinsPurchased);

      portfolio.amount +=
        coinsPurchased;

      portfolio.currentPrice =
        currentPrice;

      await portfolio.save({
        session,
      });
    }
        user.balance -= usdAmount;

    await user.save({
      session,
    });
    if (!portfolio) {
  throw new Error("Portfolio creation failed.");
}
    await Conversion.create(
  [
    {
      userId: user._id,

      fromAsset: "USD",

      toAsset: market.symbol.toUpperCase(),

      fromAmount: usdAmount,

      toAmount: coinsPurchased,

      fromPrice: 1,

      toPrice: currentPrice,
    },
  ],
  { session }
);
await session.commitTransaction();

session.endSession();

return NextResponse.json({
  success: true,

  balance: user.balance,

  portfolio: {
    symbol: market.symbol.toUpperCase(),

    amount: portfolio.amount,

    currentPrice,

    logo: market.image,
  },
});
} catch (error) {
  await session.abortTransaction();

  session.endSession();

  console.error("CONVERT ERROR:", error);

  return NextResponse.json(
    {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Conversion failed.",
    },
    {
      status: 400,
    }
  );
}
}