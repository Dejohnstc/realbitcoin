import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ["api.qrserver.com"], // ✅ allow QR image
  },
};

export default nextConfig;