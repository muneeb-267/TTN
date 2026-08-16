import type { NextConfig } from "next";

const previewOrigins = [
  "localhost:3000",
  "**.trycloudflare.com",
  "**.cursorvm.com",
  "**.agent.cvm.dev",
  "**.cvm.dev",
  "**.pinggy-free.link",
  "**.pinggy.net",
  "**.pinggy.link",
  "**.loca.lt",
  "**.ngrok-free.app",
  "**.ngrok.io",
  "**.localhost.run",
  "**.lhr.life",
  "**.serveo.net",
];

const nextConfig: NextConfig = {
  allowedDevOrigins: previewOrigins,
  experimental: {
    inlineCss: true,
    serverActions: {
      bodySizeLimit: "25mb",
      allowedOrigins: previewOrigins,
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [{ key: "Access-Control-Allow-Origin", value: "*" }],
      },
      {
        source: "/ttn.css",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Cache-Control", value: "public, max-age=300" },
        ],
      },
      {
        source: "/_next/static/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
  },
};

export default nextConfig;
