import type { NextConfig } from "next";
import path from "path";

const cspHeader = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self' mailto:",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: cspHeader,
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=(), payment=()",
  },
  {
    key: "Cross-Origin-Opener-Policy",
    value: "same-origin-allow-popups",
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  turbopack: {
    root: path.resolve(__dirname),
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/home",
        destination: "/",
        permanent: true,
      },
      {
        source: "/new-about",
        destination: "/about",
        permanent: true,
      },
      {
        source: "/about-3",
        destination: "/about",
        permanent: true,
      },
      {
        source: "/blog",
        destination: "/about",
        permanent: true,
      },
      {
        source: "/groups",
        destination: "/communities",
        permanent: true,
      },
      {
        source: "/my-groups",
        destination: "/communities",
        permanent: true,
      },
      {
        source: "/forum",
        destination: "/communities",
        permanent: true,
      },
      {
        source: "/vote-hessen",
        destination: "/communities",
        permanent: true,
      },
      {
        source: "/plans-pricing",
        destination: "/businesses",
        permanent: true,
      },
      {
        source: "/book-online",
        destination: "/businesses",
        permanent: true,
      },
      {
        source: "/form",
        destination: "/contact",
        permanent: true,
      },
      {
        source: "/site-rules-faq",
        destination: "/termsandconditions",
        permanent: true,
      },
      {
        source: "/terms",
        destination: "/termsandconditions",
        permanent: true,
      },
      {
        source: "/app-1",
        destination: "/download",
        permanent: true,
      },
      {
        source: "/reset",
        destination: "https://app.newbeeapp.com/reset-password",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
