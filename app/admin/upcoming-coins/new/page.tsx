"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}
export default function NewCoinPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    symbol: "",
    slug: "",
    logo: "",

    description: "",

    listingPrice: "",
    currentPrice: "",

    listingDate: "",

    network: "",
    contractAddress: "",

    marketCap: "",
    circulatingSupply: "",
    maxSupply: "",

    website: "",
    whitepaper: "",
    twitter: "",
    telegram: "",

    featured: false,
    allowReservation: true,
    showCountdown: true,
    displayDashboard: true,

    launchColor: "#06b6d4",

    priority: 0,

    status: "scheduled",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);

    try {
      const res = await fetch("/api/admin/upcoming-coins", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message);
        return;
      }

      alert("Coin created successfully.");

      router.push("/admin/upcoming-coins");
    } catch {
      alert("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white p-6">

      <h1 className="text-3xl font-bold">
        Add New Coin
      </h1>

      <p className="text-gray-400 mt-2 mb-8">
        Create an upcoming listing.
      </p>

      <form
        onSubmit={handleSubmit}
        className="space-y-5 max-w-4xl"
      >
        <div className="grid md:grid-cols-2 gap-5">

          <Input
            label="Coin Name"
            name="name"
            value={form.name}
            onChange={handleChange}
          />

          <Input
            label="Symbol"
            name="symbol"
            value={form.symbol}
            onChange={handleChange}
          />

          <Input
            label="Slug"
            name="slug"
            value={form.slug}
            onChange={handleChange}
          />

          <Input
            label="Logo URL"
            name="logo"
            value={form.logo}
            onChange={handleChange}
          />

          <Input
            label="Listing Price"
            name="listingPrice"
            type="number"
            value={form.listingPrice}
            onChange={handleChange}
          />

          <Input
            label="Current Price"
            name="currentPrice"
            type="number"
            value={form.currentPrice}
            onChange={handleChange}
          />

          <Input
            label="Listing Date"
            name="listingDate"
            type="datetime-local"
            value={form.listingDate}
            onChange={handleChange}
          />

          <Input
            label="Network"
            name="network"
            value={form.network}
            onChange={handleChange}
          />

        </div>

        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          rows={5}
          placeholder="Description..."
          className="w-full bg-[#131A2A] rounded-xl p-4 outline-none"
        />

        <button
          disabled={loading}
          className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold px-8 py-3 rounded-xl"
        >
          {loading ? "Creating..." : "Create Coin"}
        </button>

      </form>

    </div>
  );
}

function Input({ label, ...props }: InputProps) {
  return (
    <div>
      <label className="block mb-2 text-sm text-gray-400">
        {label}
      </label>

      <input
        {...props}
        className="w-full rounded-xl bg-[#131A2A] p-3 outline-none border border-gray-700 focus:border-cyan-400"
      />
    </div>
  );
}