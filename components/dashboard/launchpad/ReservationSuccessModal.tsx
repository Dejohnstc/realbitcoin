"use client";

import { CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface Props {
  open: boolean;
  symbol: string;
  coins: number;
  paid: number;
  balance: number;
  onClose: () => void;
}

export default function ReservationSuccessModal({
  open,
  symbol,
  coins,
  paid,
  balance,
  onClose,
}: Props) {
  const router = useRouter();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-5">

      <div className="w-full max-w-md rounded-3xl bg-[#131A2A] border border-cyan-500/40 p-7 animate-in fade-in zoom-in-95 duration-300">

        <div className="flex justify-center">

          <CheckCircle2
            size={70}
            className="text-green-400"
          />

        </div>

        <h2 className="mt-5 text-center text-2xl font-bold">
          Reservation Successful
        </h2>

        <p className="mt-2 text-center text-gray-400">
          Your allocation has been reserved.
        </p>

        <div className="mt-8 space-y-3">

          <Row
            label="Reserved"
            value={`${coins.toLocaleString()} ${symbol}`}
          />

          <Row
            label="Paid"
            value={`$${paid.toLocaleString()}`}
          />

          <Row
            label="Remaining Balance"
            value={`$${balance.toLocaleString()}`}
          />

        </div>

        <button
          onClick={() =>
            router.push("/dashboard/my-launchpad")
          }
          className="mt-8 w-full rounded-xl bg-cyan-500 py-3 font-bold text-black hover:bg-cyan-400 transition"
        >
          View My Reservations
        </button>

        <button
          onClick={onClose}
          className="mt-3 w-full rounded-xl border border-gray-700 py-3 hover:bg-[#1A2235] transition"
        >
          Continue
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
    <div className="flex justify-between rounded-xl bg-[#0B0F19] p-3">

      <span className="text-gray-400">
        {label}
      </span>

      <span className="font-semibold">
        {value}
      </span>

    </div>
  );
}