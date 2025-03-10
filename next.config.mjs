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
    // Enable new features for Next.js 15
    serverActions: true,
    typedRoutes: true,
  },
  logging: {
    fetches: {
      // Logs detailed information about data fetching
      fullUrl: process.env.NODE_ENV === 'development',
    },
  },
  // Improve build performance
  poweredByHeader: false,
};

export default nextConfig;
