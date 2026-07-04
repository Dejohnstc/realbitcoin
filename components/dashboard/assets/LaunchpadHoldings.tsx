"use client";

interface Reservation {
  _id: string;

  coinsPurchased: number;

  totalPaid: number;

  status: string;

  claimed: boolean;

  coinId: {
    name: string;
    symbol: string;
    logo: string;
    listingDate: string;
  };
}

interface Props {
  items: Reservation[];
}

export default function LaunchpadHoldings({
  items,
}: Props) {
  if (items.length === 0) return null;

  return (
    <div className="bg-[#131A2A] rounded-2xl p-5 mt-8">

      <h2 className="text-xl font-bold mb-5">
        🚀 Launchpad Holdings
      </h2>

      <div className="space-y-4">

        {items.map((item) => (

          <div
            key={item._id}
            className="bg-[#0B0F19] rounded-xl p-4 border border-gray-800"
          >
            <div className="flex justify-between">

              <div>

                <h3 className="font-semibold">
                  {item.coinId.name}
                </h3>

                <p className="text-gray-400 text-sm">
                  {item.coinId.symbol}
                </p>

              </div>

              <span
                className={`text-sm px-3 py-1 rounded-full ${
                  item.claimed
                    ? "bg-green-500/20 text-green-400"
                    : "bg-yellow-500/20 text-yellow-400"
                }`}
              >
                {item.claimed
                  ? "Claimed"
                  : "Reserved"}
              </span>

            </div>

            <div className="mt-4 text-sm space-y-2">

              <div className="flex justify-between">
                <span className="text-gray-400">
                  Purchased
                </span>

                <span>
                  {item.coinsPurchased.toLocaleString()}{" "}
                  {item.coinId.symbol}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-400">
                  Paid
                </span>

                <span>
                  ${item.totalPaid.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-400">
                  Launch
                </span>

                <span>
                  {new Date(
                    item.coinId.listingDate
                  ).toLocaleDateString()}
                </span>
              </div>

            </div>

          </div>

        ))}

      </div>

    </div>
  );
}