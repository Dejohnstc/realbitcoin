import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth";
import { getMarkets } from "@/lib/market";

import Portfolio from "@/models/portfolio";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    await connectDB();

    const { symbol } = await params;

    const token =
      req.headers.get("authorization")?.split(" ")[1];

    const decoded = verifyToken(token || "");

    if (!decoded?.userId) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const portfolio = await Portfolio.findOne({
      userId: decoded.userId,
      assetSymbol: symbol.toUpperCase(),
    });

    if (!portfolio) {
      return NextResponse.json(
        { message: "Asset not found." },
        { status: 404 }
      );
    }

    const markets = await getMarkets();

    const market = markets.find(
      (m) =>
        m.symbol.toUpperCase() ===
        symbol.toUpperCase()
    );

    if (!market) {
      return NextResponse.json(
        { message: "Market not found." },
        { status: 404 }
      );
    }

    const currentValue =
      portfolio.amount *
      market.current_price;

    const cost =
      portfolio.amount *
      portfolio.averageBuyPrice;

    const profit =
      currentValue - cost;

    const profitPercent =
      cost > 0
        ? (profit / cost) * 100
        : 0;

    return NextResponse.json({
      success: true,

      asset: {
        symbol: portfolio.assetSymbol,
        name: portfolio.assetName,
        logo: portfolio.logo,

        amount: portfolio.amount,

        averageBuyPrice:
          portfolio.averageBuyPrice,

        currentPrice:
          market.current_price,

        value: currentValue,

        profit,

        profitPercent,

        isLaunchToken:
          portfolio.isLaunchToken,
      },
    });

  } catch (error) {

    console.error(error);

    return NextResponse.json(
      {
        message: "Failed",
      },
      {
        status: 500,
      }
    );

  }
}