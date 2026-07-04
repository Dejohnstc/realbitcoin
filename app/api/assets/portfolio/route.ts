import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth";

import Portfolio from "@/models/portfolio";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const authHeader = req.headers.get("authorization");

    if (!authHeader) {
      return NextResponse.json(
        { success: false },
        { status: 401 }
      );
    }

    const token = authHeader.split(" ")[1];

    const decoded = verifyToken(token);

    if (!decoded?.userId) {
      return NextResponse.json(
        { success: false },
        { status: 401 }
      );
    }

    const assets = await Portfolio.find({
      userId: decoded.userId,
    })
      .sort({
        isLaunchToken: -1,
        amount: -1,
      })
      .lean();

    const portfolio = assets.map((asset) => {
      const value =
        asset.amount * asset.currentPrice;

      const profit =
        (asset.currentPrice -
          asset.averageBuyPrice) *
        asset.amount;

      const profitPercent =
        asset.averageBuyPrice > 0
          ? ((asset.currentPrice -
              asset.averageBuyPrice) /
              asset.averageBuyPrice) *
            100
          : 0;

      return {
        ...asset,

        value,

        profit,

        profitPercent,
      };
    });

    return NextResponse.json({
      success: true,
      portfolio,
    });

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
      },
      {
        status: 500,
      }
    );
  }
}