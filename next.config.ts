import type { NextConfig } from "next";

const previewOrigins = [
  "localhost:3000",
  "**.trycloudflare.com",
  "**.cursorvm.com",
  "**.agent.cvm.dev",
  "**.cvm.dev",
];

const nextConfig: NextConfig = {
  allowedDevOrigins: previewOrigins,
  experimental: {
    serverActions: {
      bodySizeLimit: "25mb",
      allowedOrigins: previewOrigins,
    },
  },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
  },
};

export default nextConfig;
