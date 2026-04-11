"use client";

import { useState } from "react";
import Link from "next/link";

export default function Navbar() {
  const [open, setOpen] = useState<boolean>(false);

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-[#0B0F19]/80 border-b border-gray-800">

      <div className="flex items-center justify-between px-4 py-3">

        {/* LOGO */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-gradient-to-r from-blue-500 to-purple-500"  />
          <div>
            <h1 className="text-sm font-bold gradient-text">
              RealBitcoin
            </h1>
            <p className="text-[10px] text-gray-400">
              TRADING
            </p>
          </div>
        </Link>

        {/* HAMBURGER */}
        <button
          onClick={() => setOpen(!open)}
          className="flex flex-col gap-1"
        >
          <span className="w-6 h-[2px] bg-white"></span>
          <span className="w-6 h-[2px] bg-white"></span>
          <span className="w-6 h-[2px] bg-white"></span>
        </button>
      </div>

      {/* MOBILE MENU */}
      {open && (
        <div className="px-4 pb-4 space-y-3 bg-[#0B0F19] border-t border-gray-800">

          <Link href="/" className="block text-gray-300">
            Home
          </Link>

          <Link href="/#features" className="block text-gray-300">
            Features
          </Link>

          <Link href="/#plans" className="block text-gray-300">
            Investment Plans
          </Link>

          <Link href="/#about" className="block text-gray-300">
            About Us
          </Link>

          <Link href="/#support" className="block text-gray-300">
            Support
          </Link>

          <div className="pt-3 border-t border-gray-700 space-y-2">

            <Link
              href="/auth/login"
              className="block border border-blue-500 text-center py-2 rounded-lg"
            >
              Login
            </Link>

            <Link
              href="/auth/register"
              className="block bg-yellow-500 text-black text-center py-2 rounded-lg font-semibold"
            >
              Register
            </Link>

          </div>

        </div>
      )}

    </header>
  );
}