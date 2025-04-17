import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    ppr: true,
  },
  images: {
    remotePatterns: [
      {
        hostname: 'avatar.vercel.sh',
      },
    ],
  },
  compiler: {
    // Enable SWC compiler for faster builds and type checking
    styledComponents: true,
  },
};

export default nextConfig;
