/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configure output for server-side rendering
  output: 'standalone',
  // Configure image optimization
  images: {
    unoptimized: true,
    domains: [],
  },
  // Enable source maps for better debugging
  productionBrowserSourceMaps: true,
  // Ensure proper asset handling
  poweredByHeader: false,
  compress: true,
  reactStrictMode: true,
};

module.exports = nextConfig; 