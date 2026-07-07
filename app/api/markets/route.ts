import { NextResponse } from "next/server";
import { getMarkets } from "@/lib/market";

export async function GET() {
  try {
    const markets = await getMarkets();

    return NextResponse.json({
      markets,
    });
  } catch {
    return NextResponse.json(
      {
        error: "Failed to fetch markets",
      },
      {
        status: 500,
      }
    );
  }
}