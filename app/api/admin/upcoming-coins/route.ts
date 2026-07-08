import { NextRequest, NextResponse } from "next/server";

import {connectDB} from "@/lib/mongodb";
import CoinListing from "@/models/CoinListing";

export async function GET() {
  try {
    await connectDB();

    const coins = await CoinListing.find()
      .sort({
        priority: -1,
        listingDate: 1,
      })
      .lean();

    return NextResponse.json({
      success: true,
      coins,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch coin listings.",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();

   const {
  name,
  symbol,
  slug,
  logo,
  description,

  salePrice,
  listingPrice,
  currentPrice,

  listingDate,

  network,
  contractAddress,

  marketCap,
  circulatingSupply,
  maxSupply,

  website,
  whitepaper,
  twitter,
  telegram,

  featured,
  allowReservation,
  showCountdown,
  displayDashboard,

  launchColor,
  priority,

  minPurchase,
  maxPurchase,

  totalSupply,
  reservedSupply,

  reservationEnabled,
  claimEnabled,

  reservationStart,
  reservationEnd,

  status,
} = body;
    if (!name || !symbol || !listingPrice || !listingDate) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing required fields.",
        },
        { status: 400 }
      );
    }

    const existing = await CoinListing.findOne({
      $or: [
        { symbol: symbol.toUpperCase() },
        { slug: slug.toLowerCase() },
      ],
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          message: "Coin already exists.",
        },
        { status: 400 }
      );
    }

    const coin = await CoinListing.create({
  name,
  symbol: symbol.toUpperCase(),
  slug: slug.toLowerCase(),

  logo,
  description,

  salePrice,
  listingPrice,
  currentPrice,

  listingDate,

  network,
  contractAddress,

  marketCap,
  circulatingSupply,
  maxSupply,

  website,
  whitepaper,
  twitter,
  telegram,

  featured,
  allowReservation,
  showCountdown,
  displayDashboard,

  launchColor,
  priority,

  minPurchase,
  maxPurchase,

  totalSupply,
  reservedSupply,

  reservationEnabled,
  claimEnabled,

  reservationStart,
  reservationEnd,

  status,
});

    return NextResponse.json({
      success: true,
      coin,
    });
 } catch (error) {
  console.error("CREATE COIN ERROR:", error);

  return NextResponse.json(
    {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Unable to create listing.",
    },
    { status: 500 }
  );
}
}