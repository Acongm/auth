import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@acongm/auth-client", "@acongm/config"],
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  experimental: {
    externalDir: true,
  },
};

export default nextConfig;
