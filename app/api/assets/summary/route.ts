import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth";

import User from "@/models/User";
import Investment from "@/models/Investment";
import CoinReservation from "@/models/CoinReservation";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const authHeader = req.headers.get("authorization");

    if (!authHeader) {
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
      return NextResponse.json(
        {
          success: false,
          message: "Invalid token",
        },
        { status: 401 }
      );
    }

    const user = await User.findById(decoded.userId);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found",
        },
        { status: 404 }
      );
    }

    const investments = await Investment.find({
      userId: decoded.userId,
      status: "active",
    });

    const reservations = await CoinReservation.find({
      userId: decoded.userId,
      status: "reserved",
    });

  
const launchpadReserved = reservations.reduce(
  (sum, item) => sum + item.totalPaid,
  0
);

const availableBalance = user.balance;

const lockedBalance = user.lockedBalance || 0;

const totalNetWorth =
  availableBalance + lockedBalance;
   return NextResponse.json({
  success: true,

  summary: {
    availableBalance,

    lockedBalance,

    launchpadReserved,

    activeInvestments: investments.length,

    reservationCount: reservations.length,

    totalNetWorth,
  },
});

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load asset summary.",
      },
      {
        status: 500,
      }
    );
  }
}