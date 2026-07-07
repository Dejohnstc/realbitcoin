"use client";

interface Props {
  open: boolean;
  coin: string;
  amount: number;
  usd: number;
  balance: number;
  onClose: () => void;
}

export default function ConvertSuccessModal({
  open,
  coin,
  amount,
  usd,
  balance,
  onClose,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm">

      <div className="w-[92%] max-w-md rounded-3xl border border-cyan-500/20 bg-[#131A2A] p-8 shadow-2xl">

        <div className="text-center">

          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-cyan-500/20 text-5xl">
            🎉
          </div>

          <h2 className="text-3xl font-bold">
            Conversion Successful
          </h2>

          <p className="mt-3 text-gray-400">
            Your portfolio has been updated.
          </p>

        </div>

        <div className="mt-8 space-y-4 rounded-2xl bg-[#0B0F19] p-5">

          <Row
            label="Purchased"
            value={`${amount.toFixed(8)} ${coin}`}
          />

          <Row
            label="Paid"
            value={`$${usd.toLocaleString()}`}
          />

          <Row
            label="Wallet Balance"
            value={`$${balance.toLocaleString()}`}
          />

        </div>

        <button
          onClick={onClose}
          className="mt-8 w-full rounded-xl bg-cyan-500 py-4 font-bold text-black transition hover:bg-cyan-400"
        >
          Done
        </button>

      </div>

    </div>
  );
}

function Row({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-400">
        {label}
      </span>

      <span className="font-semibold">
        {value}
      </span>
    </div>
  );
}