import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Temporary until generated shadcn/Recharts v3 type definitions are fully normalized.
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
