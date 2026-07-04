export interface CoinListing {
  _id: string;
  name: string;
  symbol: string;
  slug: string;
  logo?: string;
  listingPrice: number;
  currentPrice: number;
  listingDate: string;
  featured: boolean;
  status: string;
}