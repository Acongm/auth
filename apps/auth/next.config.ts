import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@acongm/auth-client", "@acongm/config"],
  experimental: {
    externalDir: true,
  },
};

export default nextConfig;
