import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const isDev = process.env.NODE_ENV !== "production";

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
      "style-src 'self' 'unsafe-inline'",
      "font-src 'self' data:",
      "img-src 'self' data: blob: https:",
      "media-src 'self' blob:",
      "connect-src 'self' http://localhost:* ws://localhost:* wss://localhost:*",
      "worker-src 'self' blob:",
      "frame-src 'self' blob:",
      "base-uri 'self'",
      "form-action 'self'",
      "block-all-mixed-content",
      "upgrade-insecure-requests",
    ].join("; "),
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-XSS-Protection",
    value: "1; mode=block",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
];

const nextConfig: NextConfig = {
  experimental: {
    webpackMemoryOptimizations: true,
    preloadEntriesOnStart: false,
  },

  productionBrowserSourceMaps: false,

  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:2048/api/:path*",
      },
      {
        source: "/healthz",
        destination: "http://localhost:2048/healthz",
      },
      {
        source: "/ws/:path*",
        destination: "http://localhost:2048/ws/:path*",
      },
    ];
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default withBundleAnalyzer(nextConfig);
