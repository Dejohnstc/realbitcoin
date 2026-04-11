import Navbar from "../components/NavBar";
import Hero from "../components/Hero";
import Stats from "../components/Stats";
import Plans from "../components/Plans";
import HowItWorks from "../components/HowItWorks";
import Footer from "../components/Footer";
import InvestorPopup from "../components/InvestorPopup";

export default function Home() {
  return (
    <main className="bg-[#0B0F19] text-white min-h-screen">

      {/* NAVBAR */}
      <Navbar />

      {/* HERO */}
      <Hero />

      {/* TRUST STATS */}
      <Stats />

      {/* FEATURES (NEW SECTION STYLE) */}
      <section className="px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-4">
          Powerful <span className="gradient-text">Features</span>
        </h2>

        <p className="text-gray-400 text-center mb-10">
          Everything you need to trade like a professional — all in one platform.
        </p>

        <div className="space-y-6">

          <FeatureCard
            title="Live Trades in Dashboard"
            desc="Monitor your trading activity in real-time with advanced charts, execution tracking, and full transparency on every trade."
          />

          <FeatureCard
            title="Real-Time Market Overview"
            desc="Stay ahead of the market with live data, analytics, and insights across forex, crypto, and global commodities."
          />

          <FeatureCard
            title="AI Trading Bot"
            desc="Leverage artificial intelligence to automate strategies, reduce risk, and maximize consistent returns."
          />

          <FeatureCard
            title="Live Support Chat"
            desc="Get instant assistance from our 24/7 support team whenever you need help or guidance."
          />

          <FeatureCard
            title="Bank-Grade Security"
            desc="Your funds are protected with advanced encryption, secure servers, and multi-layer authentication."
          />

          <FeatureCard
            title="Copy Trading"
            desc="Automatically replicate successful traders and earn without needing advanced trading knowledge."
          />

        </div>
      </section>

      {/* INVESTMENT PLANS */}
      <Plans />

      {/* HOW IT WORKS */}
      <HowItWorks />

      {/* SUPPORT SECTION */}
      <section className="px-4 py-16 text-center">
        <h2 className="text-3xl font-bold mb-4">
          Need <span className="gradient-text">Support?</span>
        </h2>

        <p className="text-gray-400 mb-10">
          Our dedicated support team is available 24/7 to assist you with any questions or concerns.
        </p>

        <div className="space-y-6">
          <FeatureCard
            title="Live Chat"
            desc="Instant support via our live chat feature available directly on the platform."
          />

          <FeatureCard
            title="Email Support"
            desc="Reach us anytime via email and receive a response within 24 hours."
          />

          <FeatureCard
            title="Account Manager"
            desc="Premium clients get dedicated account managers for personalized assistance."
          />
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="px-4 py-16 text-center">
        <h2 className="text-3xl font-bold mb-4">
          Ready to Start <span className="gradient-text">Trading?</span>
        </h2>

        <p className="text-gray-400 mb-8">
          Join thousands of investors worldwide who trust RealBitcoin for their investment growth.
        </p>

        <div className="space-y-4">
          <a
            href="/auth/register"
            className="block bg-yellow-500 text-black py-3 rounded-xl font-semibold"
          >
            Create Free Account →
          </a>

          <a
            href="/auth/login"
            className="block border border-blue-500 py-3 rounded-xl"
          >
            Login to Account
          </a>
        </div>
      </section>

      {/* FOOTER */}
      <Footer />

      {/* GLOBAL POPUP */}
      <InvestorPopup />

    </main>
  );
}

/* 🔥 REUSABLE FEATURE CARD */
function FeatureCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="p-6 rounded-xl input-glass border border-gray-800">
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-gray-400 text-sm">{desc}</p>
    </div>
  );
}