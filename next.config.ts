import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
      allowedOrigins: [
        "*.edut.pro",
        "edut.pro",
        "ces-bourja.edut.pro",
        "*.vercel.app",
        "edut-web-ces-bourja.vercel.app",
        "edut-web.vercel.app",
        "vercel.app",
        "localhost:3000",
        "localhost:3001",
        "localhost:3002",
      ],
    },
  },
  turbopack: {},
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
};

export default nextConfig;
