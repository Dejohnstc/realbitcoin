"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

interface Plan {
  name: string;
  min: number;
  max: number;
  returnRate: number;
  duration: string;
  risk: string;
  featured?: boolean;
  features: string[];
}

export default function InvestmentPage() {
  const router = useRouter();

  const plans: Plan[] = [
    {
      name: "Starter Plan",
      min: 100,
      max: 999,
      returnRate: 5,
      duration: "1 Month",
      risk: "Low",
      features: [
        "Monthly payouts",
        "Capital preservation focus",
        "24/7 support",
      ],
    },
    {
      name: "Silver Plan",
      min: 1000,
      max: 4999,
      returnRate: 8,
      duration: "3 Months",
      risk: "Medium",
      featured: true,
      features: [
        "Quarterly returns",
        "Diversified portfolio",
        "Priority support",
      ],
    },
    {
      name: "Gold Plan",
      min: 5000,
      max: 19999,
      returnRate: 12,
      duration: "6 Months",
      risk: "Medium",
      features: [
        "Growth-focused strategy",
        "Dedicated account manager",
        "Enhanced reporting",
      ],
    },
    {
      name: "VIP Plan",
      min: 20000,
      max: 100000,
      returnRate: 18,
      duration: "12 Months",
      risk: "High",
      features: [
        "Premium investment strategy",
        "Personal advisor",
        "Exclusive opportunities",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white p-6">
      {/* HEADER */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => router.back()}
          className="text-gray-400 hover:text-white transition"
        >
          <ArrowLeft size={20} />
        </button>

        <h1 className="text-3xl font-bold">
          Investment Plans
        </h1>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-[#131A2A] rounded-xl p-5">
          <p className="text-gray-400 text-sm">Total Investors</p>
          <h3 className="text-2xl font-bold text-yellow-400">
            8,432+
          </h3>
        </div>

        <div className="bg-[#131A2A] rounded-xl p-5">
          <p className="text-gray-400 text-sm">Assets Managed</p>
          <h3 className="text-2xl font-bold text-green-400">
            $2.8M
          </h3>
        </div>

        <div className="bg-[#131A2A] rounded-xl p-5">
          <p className="text-gray-400 text-sm">Average Annual Return</p>
          <h3 className="text-2xl font-bold text-blue-400">
            9.4%
          </h3>
        </div>
      </div>

      {/* PLANS */}
      <div className="space-y-5">
        {plans.map((plan, i) => (
          <div
            key={`${plan.name}-${i}`}
            className="
              relative
              bg-gradient-to-br
              from-[#131A2A]
              to-[#1A2238]
              p-6
              rounded-2xl
              border border-transparent
              transition-all duration-300
              hover:border-yellow-400/30
              hover:shadow-xl
              hover:shadow-yellow-400/10
              hover:scale-[1.02]
            "
          >
            {plan.featured && (
              <div className="absolute top-4 right-4">
                <span className="bg-yellow-400 text-black px-3 py-1 rounded-full text-xs font-bold">
                  MOST POPULAR
                </span>
              </div>
            )}

            <h2 className="text-xl font-bold">
              {plan.name}
            </h2>

            <p className="text-sm text-gray-400 mt-1">
              Investment Range
            </p>

            <p className="text-lg font-semibold">
              ${plan.min.toLocaleString()} - $
              {plan.max.toLocaleString()}
            </p>

            <div className="mt-4 flex flex-wrap gap-3">
              <span className="bg-green-500/10 text-green-400 px-3 py-1 rounded-full text-sm">
                Estimated Return: {plan.returnRate}% APR
              </span>

              <span className="bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full text-sm">
                Risk: {plan.risk}
              </span>

              <span className="bg-purple-500/10 text-purple-400 px-3 py-1 rounded-full text-sm">
                {plan.duration}
              </span>
            </div>

            <div className="mt-5">
              <h4 className="font-semibold mb-2">
                Plan Features
              </h4>

              <ul className="space-y-2 text-sm text-gray-300">
                {plan.features.map((feature, index) => (
                  <li
                    key={index}
                    className="flex items-center gap-2"
                  >
                    <span className="text-green-400">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={() =>
                router.push(
                  `/dashboard/investments/start?plan=${encodeURIComponent(
                    plan.name
                  )}`
                )
              }
              className="
                mt-6
                w-full
                py-3
                bg-yellow-400
                text-black
                rounded-xl
                font-semibold
                transition-all duration-200
                hover:scale-[1.03]
                active:scale-[0.97]
              "
            >
              Invest Now
            </button>
          </div>
        ))}
      </div>

      {/* PORTFOLIO ALLOCATION */}
      <div className="mt-10 bg-[#131A2A] rounded-2xl p-6">
        <h2 className="text-xl font-bold mb-4">
          Portfolio Diversification
        </h2>

        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Stocks</span>
              <span>45%</span>
            </div>
            <div className="h-2 bg-gray-700 rounded-full">
              <div className="h-2 bg-green-400 rounded-full w-[45%]" />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Real Estate</span>
              <span>25%</span>
            </div>
            <div className="h-2 bg-gray-700 rounded-full">
              <div className="h-2 bg-blue-400 rounded-full w-[25%]" />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Digital Assets</span>
              <span>20%</span>
            </div>
            <div className="h-2 bg-gray-700 rounded-full">
              <div className="h-2 bg-purple-400 rounded-full w-[20%]" />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Bonds</span>
              <span>10%</span>
            </div>
            <div className="h-2 bg-gray-700 rounded-full">
              <div className="h-2 bg-yellow-400 rounded-full w-[10%]" />
            </div>
          </div>
        </div>
      </div>

      {/* COMPARISON TABLE */}
      <div className="mt-10 bg-[#131A2A] rounded-2xl p-6 overflow-x-auto">
        <h2 className="text-xl font-bold mb-4">
          Plan Comparison
        </h2>

        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="pb-3">Plan</th>
              <th className="pb-3">Duration</th>
              <th className="pb-3">Min Deposit</th>
              <th className="pb-3">APR</th>
              <th className="pb-3">Risk</th>
            </tr>
          </thead>

          <tbody>
            {plans.map((plan) => (
              <tr
                key={plan.name}
                className="border-b border-gray-800"
              >
                <td className="py-3">{plan.name}</td>
                <td>{plan.duration}</td>
                <td>${plan.min.toLocaleString()}</td>
                <td>{plan.returnRate}%</td>
                <td>{plan.risk}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* DISCLAIMER */}
      <div className="mt-10 bg-[#131A2A] rounded-2xl p-5">
        <p className="text-xs text-gray-500 leading-relaxed">
          Investments involve risk, including possible loss of principal.
          Past performance does not guarantee future results. Returns shown
          are illustrative estimates and may vary based on market conditions,
          economic factors, and portfolio performance.
        </p>
      </div>
    </div>
  );
}