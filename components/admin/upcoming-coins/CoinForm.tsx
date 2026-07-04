"use client";

import { useState, ChangeEvent, FormEvent } from "react";
import ImageUploader from "@/components/admin/ImageUploader";
import ListingPreview from "./ListingPreview";

interface CoinFormProps {
  onSuccess?: () => void;
}

interface FormData {
  name: string;
  symbol: string;
  slug: string;

  logo: string;
  description: string;

  salePrice: string;
  listingPrice: string;
  currentPrice: string;

  listingDate: string;

  network: string;
  contractAddress: string;

  marketCap: string;
  circulatingSupply: string;
  maxSupply: string;

  website: string;
  whitepaper: string;
  twitter: string;
  telegram: string;

  featured: boolean;
  allowReservation: boolean;
  showCountdown: boolean;
  displayDashboard: boolean;

  launchColor: string;
  priority: number;

  minPurchase: string;
  maxPurchase: string;
  totalSupply: string;
  reservedSupply: string;
  reservationEnabled: boolean;
  claimEnabled: boolean;
  reservationStart: string;
  reservationEnd: string;

  status: string;
}

export default function CoinForm({
  onSuccess,
}: CoinFormProps) {
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState<FormData>({
    name: "",
    symbol: "",
    slug: "",

    logo: "",
    description: "",

    salePrice: "",
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

    launchColor: "#06B6D4",

    priority: 0,

    minPurchase: "",
    maxPurchase: "",
    totalSupply: "",
    reservedSupply: "0",

   reservationEnabled: true,
  claimEnabled: false,
    reservationStart: "",
    reservationEnd: "",

    status: "scheduled",
  });

  function update(
    e: ChangeEvent<
      HTMLInputElement |
      HTMLTextAreaElement |
      HTMLSelectElement
    >
  ) {
    const { name, value, type } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : value,
    }));
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLoading(true);

    try {
      const res = await fetch("/api/admin/upcoming-coins", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,

          salePrice: Number(form.salePrice),
          listingPrice: Number(form.listingPrice),
          currentPrice: Number(form.currentPrice),

          minPurchase: Number(form.minPurchase),
          maxPurchase: Number(form.maxPurchase),

          totalSupply: Number(form.totalSupply),
          reservedSupply: Number(form.reservedSupply),

          priority: Number(form.priority),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message);
        return;
      }

      alert("Launch created successfully.");

      onSuccess?.();

      setForm({
        name: "",
        symbol: "",
        slug: "",

        logo: "",
        description: "",

        salePrice: "",
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

        launchColor: "#06B6D4",

        priority: 0,

        minPurchase: "",
        maxPurchase: "",
        totalSupply: "",
        reservedSupply: "0",

        reservationEnabled: true,
        claimEnabled: false,
        reservationStart: "",
        reservationEnd: "",

        status: "scheduled",
      });

    } catch {
      alert("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  

  return (
      <div className="grid lg:grid-cols-2 gap-8">

  {/* FORM */}

  <form
    onSubmit={submit}
    className="space-y-7"
  >

    {/* BASIC */}

    <Section title="Basic Information">

      <Input
        label="Coin Name"
        name="name"
        value={form.name}
        onChange={update}
      />

      <div className="grid grid-cols-2 gap-4">

        <Input
          label="Symbol"
          name="symbol"
          value={form.symbol}
          onChange={update}
        />

        <Input
          label="Slug"
          name="slug"
          value={form.slug}
          onChange={update}
        />

      </div>

      <ImageUploader
        value={form.logo}
        onChange={(url) =>
          setForm((prev) => ({
            ...prev,
            logo: url,
          }))
        }
      />

    </Section>

    {/* LAUNCH */}

    <Section title="Launch Configuration">

      <Input
        label="Sale Price"
        type="number"
        name="salePrice"
        value={form.salePrice}
        onChange={update}
      />

      <Input
        label="Expected Listing Price"
        type="number"
        name="listingPrice"
        value={form.listingPrice}
        onChange={update}
      />

      <Input
        label="Listing Date"
        type="datetime-local"
        name="listingDate"
        value={form.listingDate}
        onChange={update}
      />

      <Input
        label="Network"
        name="network"
        value={form.network}
        onChange={update}
      />

      <Input
        label="Contract Address"
        name="contractAddress"
        value={form.contractAddress}
        onChange={update}
      />

    </Section>

    {/* PURCHASE */}

    <Section title="Launchpad Settings">

      <Input
        label="Minimum Purchase (Coins)"
        type="number"
        name="minPurchase"
        value={form.minPurchase}
        onChange={update}
      />

      <Input
        label="Maximum Purchase (Coins)"
        type="number"
        name="maxPurchase"
        value={form.maxPurchase}
        onChange={update}
      />

      <Input
        label="Total Supply"
        type="number"
        name="totalSupply"
        value={form.totalSupply}
        onChange={update}
      />

      <Input
        label="Reservation Start"
        type="datetime-local"
        name="reservationStart"
        value={form.reservationStart}
        onChange={update}
      />

      <Input
        label="Reservation End"
        type="datetime-local"
        name="reservationEnd"
        value={form.reservationEnd}
        onChange={update}
      />

      <label className="flex justify-between items-center">

        <span>Enable Reservations</span>

        <input
          type="checkbox"
          name="reservationEnabled"
          checked={form.reservationEnabled}
          onChange={update}
        />

      </label>

    </Section>

    {/* TOKENOMICS */}

    <Section title="Tokenomics">

      <Input
        label="Market Cap"
        name="marketCap"
        value={form.marketCap}
        onChange={update}
      />

      <Input
        label="Circulating Supply"
        name="circulatingSupply"
        value={form.circulatingSupply}
        onChange={update}
      />

      <Input
        label="Maximum Supply"
        name="maxSupply"
        value={form.maxSupply}
        onChange={update}
      />

    </Section>

    {/* DESCRIPTION */}

    <Section title="Description">

      <textarea
        rows={6}
        name="description"
        value={form.description}
        onChange={update}
        className="w-full rounded-xl bg-[#131A2A] border border-gray-700 p-3 outline-none"
      />

    </Section>

    {/* SOCIAL */}

    <Section title="Official Links">

      <Input
        label="Website"
        name="website"
        value={form.website}
        onChange={update}
      />

      <Input
        label="Whitepaper"
        name="whitepaper"
        value={form.whitepaper}
        onChange={update}
      />

      <Input
        label="Twitter"
        name="twitter"
        value={form.twitter}
        onChange={update}
      />

      <Input
        label="Telegram"
        name="telegram"
        value={form.telegram}
        onChange={update}
      />

    </Section>

    {/* DISPLAY */}

    <Section title="Display">

      <label className="flex justify-between">

        <span>Featured</span>

        <input
          type="checkbox"
          name="featured"
          checked={form.featured}
          onChange={update}
        />

      </label>

      <label className="flex justify-between">

        <span>Show Countdown</span>

        <input
          type="checkbox"
          name="showCountdown"
          checked={form.showCountdown}
          onChange={update}
        />

      </label>

      <label className="flex justify-between">

        <span>Display On Dashboard</span>

        <input
          type="checkbox"
          name="displayDashboard"
          checked={form.displayDashboard}
          onChange={update}
        />
<label className="flex justify-between items-center">
  <span>Enable Claim</span>

  <input
    type="checkbox"
    name="claimEnabled"
    checked={form.claimEnabled}
    onChange={update}
  />
</label>
      </label>

      <Input
        label="Launch Color"
        type="color"
        name="launchColor"
        value={form.launchColor}
        onChange={update}
      />

      <Input
        label="Priority"
        type="number"
        name="priority"
        value={String(form.priority)}
        onChange={update}
      />

      <select
        name="status"
        value={form.status}
        onChange={update}
        className="w-full rounded-xl bg-[#131A2A] border border-gray-700 p-3"
      >
        <option value="scheduled">Scheduled</option>
        <option value="launching">Launching</option>
        <option value="live">Live</option>
        <option value="completed">Completed</option>
        <option value="cancelled">Cancelled</option>
      </select>

    </Section>

    <button
      disabled={loading}
      className="w-full rounded-xl bg-cyan-500 hover:bg-cyan-400 py-4 text-black font-bold"
    >
      {loading ? "Creating Launch..." : "Create Launch"}
    </button>

  </form>

  {/* PREVIEW */}

  <ListingPreview
    logo={form.logo}
    name={form.name}
    symbol={form.symbol}
    listingPrice={form.listingPrice}
    listingDate={form.listingDate}
    featured={form.featured}
    status={form.status}
  />

</div>
);
}

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

function Section({
  title,
  children,
}: SectionProps) {
  return (
    <div className="rounded-2xl bg-[#0B0F19] border border-gray-800 p-5">
      <h3 className="text-lg font-semibold mb-5">
        {title}
      </h3>

      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
}

interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

function Input({
  label,
  className,
  ...props
}: InputProps) {
  return (
    <div>
      <label className="block text-sm text-gray-400 mb-2">
        {label}
      </label>

      <input
        {...props}
        className={`w-full rounded-xl bg-[#131A2A] border border-gray-700 p-3 outline-none focus:border-cyan-400 transition ${className ?? ""}`}
      />
    </div>
  );
}