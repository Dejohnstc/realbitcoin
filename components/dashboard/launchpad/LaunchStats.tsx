"use client";

interface Props {
  totalSupply: number;
  reservedSupply: number;
  investors: number;
  salePrice: number;
}

export default function LaunchStats({
  totalSupply,
  reservedSupply,
  investors,
  salePrice,
}: Props) {
  const remaining = Math.max(
    totalSupply - reservedSupply,
    0
  );

  const raised = reservedSupply * salePrice;

  const progress =
    totalSupply > 0
      ? Math.min(
          (reservedSupply / totalSupply) * 100,
          100
        )
      : 0;

  return (
    <div className="rounded-2xl bg-[#131A2A] border border-gray-800 p-6">

      <div className="flex items-center justify-between mb-6">

        <h2 className="text-xl font-bold">
          📊 Launch Statistics
        </h2>

        <span className="rounded-full bg-cyan-500/20 px-3 py-1 text-xs font-semibold text-cyan-400">
          LIVE
        </span>

      </div>

      <div className="grid grid-cols-2 gap-4">

        <Stat
          title="Funds Raised"
          value={`$${raised.toLocaleString()}`}
        />

        <Stat
          title="Participants"
          value={investors.toLocaleString()}
        />

        <Stat
          title="Reserved Supply"
          value={reservedSupply.toLocaleString()}
        />

        <Stat
          title="Remaining Supply"
          value={remaining.toLocaleString()}
        />

      </div>

      <div className="mt-8">

        <div className="mb-2 flex justify-between text-sm">

          <span className="text-gray-400">
            Sale Progress
          </span>

          <span className="font-semibold text-cyan-400">
            {progress.toFixed(2)}%
          </span>

        </div>

        <div className="h-3 overflow-hidden rounded-full bg-[#0B0F19]">

          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 transition-all duration-700"
            style={{
              width: `${progress}%`,
            }}
          />

        </div>

        <div className="mt-3 flex justify-between text-xs text-gray-500">

          <span>
            {reservedSupply.toLocaleString()} Reserved
          </span>

          <span>
            {totalSupply.toLocaleString()} Total
          </span>

        </div>

      </div>

    </div>
  );
}

function Stat({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-gray-800 bg-[#0B0F19] p-4 transition hover:border-cyan-500">

      <p className="text-xs uppercase tracking-wide text-gray-400">
        {title}
      </p>

      <p className="mt-3 text-2xl font-bold text-cyan-400">
        {value}
      </p>

    </div>
  );
}