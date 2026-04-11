"use client";

import Link from "next/link";

interface Plan {
  name: string;
  roi: string;
  duration: string;
  min: string;
  max: string;
  highlight?: boolean;
}

const plans: Plan[] = [
  {
    name: "Basic Plan",
    roi: "10%",
    duration: "Daily for 7 days",
    min: "$50",
    max: "$500",
  },
  {
    name: "Standard Plan",
    roi: "25%",
    duration: "After 3 days",
    min: "$500",
    max: "$5,000",
    highlight: true,
  },
  {
    name: "Premium Plan",
    roi: "50%",
    duration: "After 7 days",
    min: "$5,000",
    max: "Unlimited",
  },
];

export default function Plans() {
  return (
    <section id="plans" className="px-4 py-16">

      {/* TITLE */}
      <h2 className="text-3xl font-bold text-center mb-4">
        Investment <span className="gradient-text">Plans</span>
      </h2>

      <p className="text-gray-400 text-center mb-10">
        Choose a plan that suits your financial goals and start earning today.
      </p>

      {/* CARDS */}
      <div className="grid gap-6 md:grid-cols-3 max-w-6xl mx-auto">

        {plans.map((plan, i) => (
          <div
            key={i}
            className={`relative p-6 rounded-2xl border transition-all duration-300 ${
              plan.highlight
                ? "border-yellow-500 bg-[#131A2A] scale-105 shadow-lg"
                : "border-gray-800 bg-[#0E1422]"
            }`}
          >

            {/* BADGE */}
            {plan.highlight && (
              <span className="absolute top-3 right-3 text-xs bg-yellow-500 text-black px-2 py-1 rounded">
                MOST POPULAR
              </span>
            )}

            {/* NAME */}
            <h3 className="text-xl font-semibold mb-3">
              {plan.name}
            </h3>

            {/* ROI */}
            <p className="text-4xl font-bold text-yellow-400 mb-2">
              {plan.roi}
            </p>

            <p className="text-gray-400 mb-6">
              {plan.duration}
            </p>

            {/* FEATURES */}
            <ul className="text-gray-400 space-y-2 mb-6 text-sm">
              <li>✔ Minimum: {plan.min}</li>
              <li>✔ Maximum: {plan.max}</li>
              <li>✔ Instant Withdrawals</li>
              <li>✔ 24/7 Support</li>
            </ul>

            {/* BUTTON */}
            <Link
              href="/auth/register"
              className={`block text-center py-3 rounded-xl font-semibold ${
                plan.highlight
                  ? "bg-yellow-500 text-black"
                  : "bg-gradient-to-r from-blue-500 to-purple-500"
              }`}
            >
              Invest Now →
            </Link>

          </div>
        ))}

      </div>
    </section>
  );
}