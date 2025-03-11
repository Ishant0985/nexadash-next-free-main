/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
  experimental: {
    // Set serverActions as an object, not a boolean.
    serverActions: {},
    // Remove typedRoutes option since it's not supported with Turbopack.
    turbo: {},
  },
  logging: {
    fetches: {
      fullUrl: process.env.NODE_ENV === 'development',
    },
  },
  poweredByHeader: false,
};

export default nextConfig;