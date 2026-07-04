"use client";

import { useEffect, useState } from "react";
import MyLaunchpadCard from "@/components/dashboard/launchpad/MyLaunchpadCard";

interface Coin {
  _id: string;
  name: string;
  symbol: string;
  logo: string;
  listingDate: string;
  currentPrice: number;
  claimEnabled: boolean;
}

interface Reservation {
  _id: string;
  coinsPurchased: number;
  totalPaid: number;
  salePrice: number;
  status: "reserved" | "claimed" | "cancelled";
  claimed: boolean;
  coinId: Coin;
}

export default function MyLaunchpadPage() {
  const [items, setItems] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReservations() {
      try {
        const token = localStorage.getItem("user_token");

        if (!token) {
          setLoading(false);
          return;
        }

        const res = await fetch(
          "/api/launchpad/my-reservations",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            cache: "no-store",
          }
        );

        const data = await res.json();

        if (data.success) {
          setItems(data.reservations || []);
        }
      } catch (error) {
        console.error(
          "Failed to load reservations:",
          error
        );
      } finally {
        setLoading(false);
      }
    }

    loadReservations();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F19] text-white flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white p-8">
      <h1 className="text-4xl font-bold mb-8">
        My Launchpad
      </h1>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-gray-800 bg-[#131A2A] p-10 text-center">
          <h2 className="text-2xl font-semibold">
            No Launch Reservations
          </h2>

          <p className="mt-3 text-gray-400">
            You have&apos;t reserved any launch allocations yet.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {items.map((item) => (
            <MyLaunchpadCard
              key={item._id}
              reservation={item}
            />
          ))}
        </div>
      )}
    </div>
  );
}