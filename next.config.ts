import type { NextConfig } from "next";

const PROD_FRAME_ANCESTORS =
  "frame-ancestors 'self' https://sinvestir.fr https://simulateurs.sinvestir.fr https://*.vercel.app";

const DEV_FRAME_ANCESTORS = `${PROD_FRAME_ANCESTORS} http://localhost:*`;

const frameAncestors =
  process.env.NODE_ENV === "production" ? PROD_FRAME_ANCESTORS : DEV_FRAME_ANCESTORS;

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: frameAncestors },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
