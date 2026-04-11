"use client";

import Link from "next/link";

export default function Hero() {
  return (
    <section className="px-4 pt-10 pb-16 text-center relative overflow-hidden">

      {/* 🔥 BACKGROUND GLOW */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#1e3a8a,transparent_70%)] opacity-30"></div>

      {/* TRUST BADGE */}
      <div className="inline-block mb-6 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-sm">
        ⚡ Trusted by 150,000+ Traders Worldwide
      </div>

      {/* MAIN HEADING */}
      <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-4">
        Your Gateway to{" "}
        <span className="gradient-text">
          Global Markets
        </span>
      </h1>

      {/* SUBTEXT */}
      <p className="text-gray-400 max-w-md mx-auto mb-8 text-sm md:text-base">
        Trade forex, cryptocurrencies, and commodities with institutional-grade tools,
        real-time analytics, and 24/7 dedicated support.
      </p>

      {/* CTA BUTTON */}
     <Link
  href="/auth/register"
  className="relative z-10 inline-block px-8 py-3 rounded-xl bg-gradient-to-r from-yellow-400 to-yellow-600 text-black font-semibold shadow-lg"
>
  Register Now →
</Link>

      {/* STATS BELOW (optional quick trust boost) */}
      <div className="mt-10 grid grid-cols-3 gap-4 text-center">

        <div>
          <p className="text-xl font-bold">$2.5B+</p>
          <p className="text-xs text-gray-400">Trading Volume</p>
        </div>

        <div>
          <p className="text-xl font-bold">150K+</p>
          <p className="text-xs text-gray-400">Active Traders</p>
        </div>

        <div>
          <p className="text-xl font-bold">99.9%</p>
          <p className="text-xs text-gray-400">Uptime</p>
        </div>

      </div>

    </section>
  );
}