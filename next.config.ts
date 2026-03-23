import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "d4lgxe9bm8juw.cloudfront.net",
      },
      {
        protocol: "https",
        hostname: "www.canva.com",
      },
      {
        protocol: "https",
        hostname: "www.melhorenvio.com.br",
      },
      {
        protocol: "https",
        hostname: "melhorenvio.com.br",
      },
      {
        protocol: "https",
        hostname: "sandbox.melhorenvio.com.br",
      },
    ],
  },
};

export default nextConfig;
