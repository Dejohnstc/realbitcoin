"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

interface Plan {
  name: string;
  min: number;
  max: number;
  profit: number;
  duration: string;
}

export default function InvestmentPage() {
  const router = useRouter();

  const plans: Plan[] = [
    {
      name: "Starter Plan",
      min: 100,
      max: 999,
      profit: 10,
      duration: "24 Hours",
    },
    {
      name: "Silver Plan",
      min: 1000,
      max: 4999,
      profit: 25,
      duration: "3 Days",
    },
    {
      name: "Gold Plan",
      min: 5000,
      max: 19999,
      profit: 50,
      duration: "7 Days",
    },
    {
      name: "VIP Plan",
      min: 20000,
      max: 100000,
      profit: 80,
      duration: "14 Days",
    },
  ];

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white p-2">

      {/* HEADER */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.back()}
          className="text-gray-400 hover:text-white transition"
        >
          <ArrowLeft size={20} />
        </button>

        <h1 className="text-2xl font-bold">
          Investment Plans
        </h1>
      </div>

      <div className="space-y-4">

        {plans.map((plan, i) => (
          <div
            key={`${plan.name}-${i}`} // ✅ FIXED key
            className="bg-[#131A2A] p-5 rounded-xl transition-all duration-300 
                       hover:scale-[1.02] hover:shadow-lg hover:shadow-yellow-400/10 
                       hover:border hover:border-yellow-400/30 
                       animate-fadeUp"
            style={{
              animationDelay: `${i * 0.1}s`,
            }}
          >
            <h2 className="text-lg font-semibold">
              {plan.name}
            </h2>

            <p className="text-sm text-gray-400 mt-1">
              ${plan.min} - ${plan.max}
            </p>

            <p className="text-green-400 mt-2 font-semibold">
              {plan.profit}% Profit
            </p>

            <p className="text-gray-400 text-sm">
              Duration: {plan.duration}
            </p>

            <button
              onClick={() =>
                router.push(
                  `/dashboard/investments/start?plan=${encodeURIComponent(plan.name)}`
                )
              }
              className="mt-4 w-full py-3 bg-yellow-400 text-black rounded-xl font-semibold 
                         transition-all duration-200 
                         hover:scale-[1.03] active:scale-[0.97]"
            >
              Invest Now
            </button>
          </div>
        ))}

      </div>

    </div>
  );
}