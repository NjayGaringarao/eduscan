import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "puppeteer-core",
    "@sparticuz/chromium",
    "@sparticuz/chromium-min",
  ],
  // Ensure these packages are not bundled
  experimental: {
    serverComponentsExternalPackages: [
      "puppeteer-core",
      "@sparticuz/chromium",
      "@sparticuz/chromium-min",
    ],
  },
};

export default nextConfig;
