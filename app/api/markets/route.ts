import { NextResponse } from "next/server";

interface Market {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
}

// ✅ typed cache (no any)
let cache: Market[] | null = null;
let lastFetch = 0;

export async function GET() {
  try {
    const now = Date.now();

    // ✅ CACHE FOR 30 SECONDS
    if (cache && now - lastFetch < 30000) {
      return NextResponse.json({ markets: cache });
    }

    const res = await fetch(
      "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=6&page=1&sparkline=false"
    );

    const data: Market[] = await res.json(); // ✅ typed response

    cache = data;
    lastFetch = now;

    return NextResponse.json({ markets: data });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to fetch markets" },
      { status: 500 }
    );
  }
}