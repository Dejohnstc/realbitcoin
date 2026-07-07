interface Market {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
}

let cache: Market[] = [];
let lastFetch = 0;

export async function getMarkets() {
  const now = Date.now();

  if (cache.length > 0 && now - lastFetch < 30000) {
  return cache;
}

  const res = await fetch(
    "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false",
    {
      next: {
        revalidate: 30,
      },
    }
  );

  if (!res.ok) {
    throw new Error("Failed to load markets");
  }

  cache = await res.json();
  lastFetch = now;

  return cache;
}