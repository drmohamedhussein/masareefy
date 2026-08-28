import type { NextConfig } from "next";
import { withSerwist } from "@serwist/turbopack";

/**
 * Notion embed support:
 * - Do NOT set X-Frame-Options DENY/SAMEORIGIN (would block Notion iframes).
 * - Allow Notion domains via CSP frame-ancestors.
 */
const notionFrameAncestors = [
  "'self'",
  "https://www.notion.so",
  "https://notion.so",
  "https://*.notion.so",
  "https://*.notion.site",
].join(" ");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: `frame-ancestors ${notionFrameAncestors};`,
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
        ],
      },
      {
        source: "/embed",
        headers: [
          {
            key: "Content-Security-Policy",
            value: `frame-ancestors ${notionFrameAncestors};`,
          },
        ],
      },
      {
        source: "/embed/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: `frame-ancestors ${notionFrameAncestors};`,
          },
        ],
      },
      {
        source: "/serwist/:path*",
        headers: [
          {
            key: "Service-Worker-Allowed",
            value: "/",
          },
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
        ],
      },
    ];
  },
};

export default withSerwist(nextConfig);

import('@opennextjs/cloudflare').then(m => m.initOpenNextCloudflareForDev());
