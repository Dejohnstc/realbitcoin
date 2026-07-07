import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";

import { connectDB } from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth";
import { getMarkets } from "@/lib/market";

import User from "@/models/User";
import Portfolio from "@/models/portfolio";
import Conversion from "@/models/Conversion";

interface ConvertBody {
  fromAsset: string;
  toAsset: string;
  amount: number;
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
      const {
  fromAsset,
  toAsset,
  amount,
}: ConvertBody = await req.json();

if (
  !fromAsset ||
  !toAsset ||
  fromAsset === toAsset ||
  amount <= 0
) {
  throw new Error("Invalid conversion request.");
}
        const user = await User.findById(
      decoded.userId
    ).session(session);

    if (!user) {
      throw new Error("User not found.");
    }
const markets = await getMarkets();

     const fromMarket =
  fromAsset === "USD"
    ? {
        symbol: "USD",
        name: "US Dollar",
        image: "",
        current_price: 1,
      }
    : markets.find(
        (m) =>
          m.symbol.toUpperCase() ===
          fromAsset.toUpperCase()
      );

const toMarket =
  toAsset === "USD"
    ? {
        symbol: "USD",
        name: "US Dollar",
        image: "",
        current_price: 1,
      }
    : markets.find(
        (m) =>
          m.symbol.toUpperCase() ===
          toAsset.toUpperCase()
      );

if (!fromMarket || !toMarket) {
  throw new Error("Unsupported asset.");
}

const usdValue =
  fromAsset === "USD"
    ? amount
    : amount * fromMarket.current_price;

const receiveAmount =
  toAsset === "USD"
    ? usdValue
    : usdValue / toMarket.current_price;
       if (fromAsset === "USD") {
  // BUY CRYPTO

  if (user.balance < amount) {
    throw new Error("Insufficient USD balance.");
  }

  user.balance -= amount;

  let portfolio = await Portfolio.findOne({
    userId: user._id,
    assetSymbol: toMarket.symbol.toUpperCase(),
  }).session(session);

  if (!portfolio) {
    const [newPortfolio] = await Portfolio.create(
      [
        {
          userId: user._id,
          assetSymbol: toMarket.symbol.toUpperCase(),
          assetName: toMarket.name,
          logo: toMarket.image,
          amount: receiveAmount,
          averageBuyPrice: toMarket.current_price,
          currentPrice: toMarket.current_price,
          isLaunchToken: false,
        },
      ],
      { session }
    );

    portfolio = newPortfolio;
  } else {
    const totalCost =
      portfolio.amount *
      portfolio.averageBuyPrice;

    portfolio.averageBuyPrice =
      (totalCost + amount) /
      (portfolio.amount + receiveAmount);

    portfolio.amount += receiveAmount;
    portfolio.currentPrice = toMarket.current_price;

    await portfolio.save({ session });
  }

  await user.save({ session });

  await Conversion.create(
    [
      {
        userId: user._id,
        fromAsset,
        toAsset,
        fromAmount: amount,
        toAmount: receiveAmount,
        fromPrice: 1,
        toPrice: toMarket.current_price,
      },
    ],
    { session }
  );

  await session.commitTransaction();
  session.endSession();

  return NextResponse.json({
    success: true,
    balance: user.balance,
    portfolio,
  });
}

if (toAsset === "USD") {
  // SELL CRYPTO

  const portfolio = await Portfolio.findOne({
    userId: user._id,
    assetSymbol: fromAsset.toUpperCase(),
  }).session(session);

  if (!portfolio) {
    throw new Error("Asset not found.");
  }

  if (portfolio.amount < amount) {
    throw new Error("Insufficient asset balance.");
  }

  portfolio.amount -= amount;
  portfolio.currentPrice = fromMarket.current_price;

  if (portfolio.amount <= 0) {
    await Portfolio.deleteOne(
      { _id: portfolio._id },
      { session }
    );
  } else {
    await portfolio.save({ session });
  }

  user.balance += receiveAmount;

  await user.save({ session });

  await Conversion.create(
    [
      {
        userId: user._id,
        fromAsset,
        toAsset,
        fromAmount: amount,
        toAmount: receiveAmount,
        fromPrice: fromMarket.current_price,
        toPrice: 1,
      },
    ],
    { session }
  );

  await session.commitTransaction();
  session.endSession();

  return NextResponse.json({
    success: true,
    balance: user.balance,
  });
}

throw new Error(
  "Crypto to crypto conversion is coming soon."
);   

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