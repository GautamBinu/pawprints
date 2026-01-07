import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/p/:id",
        destination: "/?p=:id",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
