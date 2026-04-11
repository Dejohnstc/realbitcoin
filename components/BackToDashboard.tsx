"use client";

import { useRouter } from "next/navigation";

export default function BackToDashboard() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push("/dashboard")}
      className="px-3 py-2 rounded-lg border border-yellow-400 text-yellow-400 text-sm hover:bg-yellow-400 hover:text-black transition"
    >
      Back
    </button>
  );
}