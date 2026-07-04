export interface LaunchpadCoin {
  _id: string;
  name: string;
  symbol: string;
  logo: string;
  listingDate: string;
}

export interface LaunchReservation {
  _id: string;

  coinsPurchased: number;

  totalPaid: number;

  salePrice: number;

  status: string;

  claimed: boolean;

  coinId: LaunchpadCoin;
}