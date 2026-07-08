"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Coins,
  Star,
} from "lucide-react";
import CoinDrawer from "@/components/admin/upcoming-coins/CoinDrawer";
import CoinForm from "@/components/admin/upcoming-coins/CoinForm";

interface CoinListing {
  _id: string;
  name: string;
  symbol: string;
  logo: string;
  listingPrice: number;
  listingDate: string;
  status: string;
  featured: boolean;
}

export default function UpcomingCoinsPage() {
  const router = useRouter();

  const [coins, setCoins] = useState<CoinListing[]>([]);
  const [loading, setLoading] = useState(true);
const [drawerOpen, setDrawerOpen] = useState(false);
  const [search, setSearch] = useState("");

  const [status, setStatus] = useState("all");

  async function loadCoins() {
    try {
      const res = await fetch("/api/admin/upcoming-coins");

      const data = await res.json();

      setCoins(data.coins || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCoins();
  }, []);

 async function deleteCoin(id: string) {
  if (!confirm("Delete this listing?")) return;

  try {
    const res = await fetch(`/api/admin/upcoming-coins/${id}`, {
      method: "DELETE",
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "Delete failed.");
      return;
    }

    setCoins((prev) => prev.filter((coin) => coin._id !== id));

    alert("Listing deleted successfully.");

  } catch (error) {
    console.error(error);
    alert("Something went wrong.");
  }
}

  const filtered = useMemo(() => {
    return coins.filter((coin) => {
      const matchesSearch =
        coin.name.toLowerCase().includes(search.toLowerCase()) ||
        coin.symbol.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        status === "all" || coin.status === status;

      return matchesSearch && matchesStatus;
    });
  }, [coins, search, status]);

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white p-6">

      {/* Header */}

      <div className="flex items-center justify-between mb-8">

        <div>

          <h1 className="text-3xl font-bold">
            Upcoming Listings
          </h1>

          <p className="text-gray-400 mt-2">
            Manage all upcoming launches.
          </p>

        </div>

        <button
          onClick={() => setDrawerOpen(true)}
          className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold px-5 py-3 rounded-xl flex items-center gap-2"
        >
          <Plus size={18} />
          Add Coin
        </button>

      </div>

      {/* Analytics */}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">

        <Stat
          title="Total"
          value={coins.length}
        />

        <Stat
          title="Scheduled"
          value={coins.filter(c=>c.status==="scheduled").length}
        />

        <Stat
          title="Live"
          value={coins.filter(c=>c.status==="live").length}
        />

        <Stat
          title="Featured"
          value={coins.filter(c=>c.featured).length}
        />

      </div>

      {/* Search */}

      <div className="flex gap-4 mb-8">

        <div className="flex-1 relative">

          <Search
            size={18}
            className="absolute left-3 top-3 text-gray-500"
          />

          <input
            placeholder="Search coin..."
            value={search}
            onChange={(e)=>setSearch(e.target.value)}
            className="w-full bg-[#131A2A] rounded-xl pl-10 p-3 outline-none"
          />

        </div>

        <select
          value={status}
          onChange={(e)=>setStatus(e.target.value)}
          className="bg-[#131A2A] rounded-xl px-4"
        >
          <option value="all">All</option>
          <option value="scheduled">Scheduled</option>
          <option value="launching">Launching</option>
          <option value="live">Live</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>

      </div>

      {/* Cards */}

      {loading ? (

        <p>Loading...</p>

      ) : filtered.length === 0 ? (

        <div className="text-center py-20">

          <Coins
            size={60}
            className="mx-auto text-gray-600 mb-4"
          />

          <h2 className="text-xl font-semibold">

            No Listings Yet

          </h2>

          <p className="text-gray-500 mt-2">

            Create your first coin listing.

          </p>

        </div>

      ) : (

        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">

          {filtered.map((coin)=>(
            <div
              key={coin._id}
              className="bg-[#131A2A] rounded-2xl border border-gray-800 p-5"
            >

              <div className="flex justify-between">

                <div>

                  <h2 className="text-xl font-bold">

                    {coin.name}

                  </h2>

                  <p className="text-gray-400">

                    {coin.symbol}

                  </p>

                </div>

                {coin.featured && (

                  <Star
                    className="text-yellow-400"
                    fill="currentColor"
                  />

                )}

              </div>

              <div className="mt-5 space-y-2 text-sm">

                <div className="flex justify-between">

                  <span className="text-gray-400">

                    Listing Price

                  </span>

                  <span>

                    ${coin.listingPrice}

                  </span>

                </div>

                <div className="flex justify-between">

                  <span className="text-gray-400">

                    Listing Date

                  </span>

                  <span>

                    {new Date(
                      coin.listingDate
                    ).toLocaleDateString()}

                  </span>

                </div>

                <div className="flex justify-between">

                  <span className="text-gray-400">

                    Status

                  </span>

                  <span className="capitalize text-cyan-400">

                    {coin.status}

                  </span>

                </div>

              </div>

              <div className="flex gap-3 mt-6">

                <button
                  onClick={()=>router.push(`/admin/upcoming-coins/edit/${coin._id}`)}
                  className="flex-1 bg-cyan-500 py-2 rounded-lg text-black font-semibold flex justify-center items-center gap-2"
                >
                  <Pencil size={16}/>
                  Edit
                </button>

                <button
                  onClick={()=>deleteCoin(coin._id)}
                  className="px-4 bg-red-500 rounded-lg"
                >
                  <Trash2 size={18}/>
                </button>

              </div>

            </div>
          ))}

        </div>

      )}
      

      {/* Add Coin Drawer */}

      <CoinDrawer
  open={drawerOpen}
  title="Add New Listing"
  onClose={() => setDrawerOpen(false)}
>
  <CoinForm
    onSuccess={() => {
      setDrawerOpen(false);
      loadCoins();
    }}
  />
</CoinDrawer>

    </div>
  );
}


function Stat({
  title,
  value,
}:{
  title:string;
  value:number;
}){

  return(

    <div className="bg-[#131A2A] rounded-2xl p-5">

      <p className="text-gray-400 text-sm">

        {title}

      </p>

      <h2 className="text-3xl font-bold mt-2">

        {value}

      </h2>

    </div>

  )

}