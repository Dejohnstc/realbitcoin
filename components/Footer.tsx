import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-[#020617] border-t border-gray-800 px-4 py-12 mt-16">

      <div className="max-w-6xl mx-auto grid gap-8 md:grid-cols-4">

        {/* BRAND */}
        <div>
          <h2 className="text-lg font-bold gradient-text mb-3">
            RealBitcoin
          </h2>

          <p className="text-gray-400 text-sm">
            RealBitcoin is a global investment platform providing secure and reliable
            access to cryptocurrency, forex, and commodity trading markets.
          </p>
        </div>

        {/* QUICK LINKS */}
        <div>
          <h3 className="font-semibold mb-3">Quick Links</h3>

          <ul className="space-y-2 text-gray-400 text-sm">
            <li><Link href="/">Home</Link></li>
            <li><Link href="/#plans">Investment Plans</Link></li>
            <li><Link href="/#features">Features</Link></li>
            <li><Link href="/#support">Support</Link></li>
          </ul>
        </div>

        {/* SUPPORT */}
        <div>
          <h3 className="font-semibold mb-3">Support</h3>

          <ul className="space-y-2 text-gray-400 text-sm">
            <li>Email: support@realbitcoin.com</li>
            <li>Live Chat Available</li>
            <li>24/7 Customer Support</li>
          </ul>
        </div>

        {/* LEGAL */}
        <div>
          <h3 className="font-semibold mb-3">Legal</h3>

          <ul className="space-y-2 text-gray-400 text-sm">
            <li>Privacy Policy</li>
            <li>Terms & Conditions</li>
            <li>Risk Disclaimer</li>
          </ul>
        </div>

      </div>

      {/* DIVIDER */}
      <div className="border-t border-gray-800 mt-10 pt-6 text-center text-gray-500 text-sm">

        <p>
          © 2026 RealBitcoin. All rights reserved.
        </p>

        <p className="mt-2 text-xs max-w-xl mx-auto text-gray-600">
          Trading involves risk. Past performance is not indicative of future results.
          Ensure you understand the risks before investing.
        </p>

      </div>

    </footer>
  );
}