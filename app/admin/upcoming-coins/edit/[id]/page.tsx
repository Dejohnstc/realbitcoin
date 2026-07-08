"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import CoinForm from "@/components/admin/upcoming-coins/CoinForm";

export default function EditCoinPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [coin, setCoin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCoin() {
      try {
        const res = await fetch("/api/admin/upcoming-coins");

        const data = await res.json();

        const found = data.coins.find(
          (c: { _id: string }) => c._id === id
        );

        if (!found) {
          alert("Listing not found.");
          router.push("/admin/upcoming-coins");
          return;
        }

        setCoin(found);
      } finally {
        setLoading(false);
      }
    }

    loadCoin();
  }, [id, router]);

  if (loading) {
    return (
      <div className="p-10 text-white">
        Loading listing...
      </div>
    );
  }

  if (!coin) return null;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-white mb-8">
        Edit Coin Listing
      </h1>

      <CoinForm
        coin={coin}
        isEditing
        onSuccess={() =>
          router.push("/admin/upcoming-coins")
        }
      />
    </div>
  );
}