"use client";

interface LaunchProgressProps {
  totalSupply: number;
  reservedSupply: number;
  investors: number;
}

export default function LaunchProgress({
  totalSupply,
  reservedSupply,
  investors,
}: LaunchProgressProps) {
  const actualPercentage =
  totalSupply > 0
    ? Math.min(
        (reservedSupply / totalSupply) * 100,
        100
      )
    : 0;

// Show a tiny visible bar when reservations exist
const displayPercentage =
  actualPercentage > 0 && actualPercentage < 0.5
    ? 0.5
    : actualPercentage;

  return (
    <div className="rounded-2xl bg-[#131A2A] border border-gray-800 p-6">

      <div className="flex justify-between mb-4">

        <h2 className="text-xl font-bold">
          Launch Progress
        </h2>

        <span className="text-cyan-400 font-bold">
          {actualPercentage > 0 && actualPercentage < 0.01
  ? "<0.01%"
  : `${actualPercentage.toFixed(2)}%`}
        </span>

      </div>

      <div className="w-full h-4 rounded-full bg-[#0B0F19] overflow-hidden">

        <div
          className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-700"
          style={{
  width: `${displayPercentage}%`,
}}
        />

      </div>

      <div className="mt-5 space-y-3 text-sm">

        <div className="flex justify-between">
          <span className="text-gray-400">
            Reserved
          </span>

          <span>
            {reservedSupply.toLocaleString()}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-400">
            Remaining
          </span>

          <span>
            {(totalSupply - reservedSupply).toLocaleString()}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-400">
            Investors
          </span>

          <span>
            {investors.toLocaleString()}
          </span>
        </div>

      </div>

    </div>
  );
}