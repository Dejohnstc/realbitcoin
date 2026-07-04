"use client";

import { X } from "lucide-react";
import { ReactNode } from "react";

interface CoinDrawerProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export default function CoinDrawer({
  open,
  title,
  onClose,
  children,
}: CoinDrawerProps) {
  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/60 z-40 transition-opacity duration-300 ${
          open
            ? "opacity-100 visible"
            : "opacity-0 invisible"
        }`}
      />

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 h-screen w-full sm:w-[520px] bg-[#131A2A] border-l border-gray-800 z-50 shadow-2xl transform transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-800">

          <h2 className="text-xl font-bold text-white">
            {title}
          </h2>

          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition"
          >
            <X size={20} />
          </button>

        </div>

        <div className="overflow-y-auto h-[calc(100vh-80px)] p-6">
          {children}
        </div>
      </div>
    </>
  );
}