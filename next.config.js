/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable strict mode for better development experience
  reactStrictMode: true,
  // Ensure proper asset handling
  images: {
    unoptimized: true,
  },
  // Configure output
  output: 'standalone',
  // Enable source maps for better debugging
  productionBrowserSourceMaps: true,
  // Configure experimental features
  experimental: {
    // Disable turbo for now
    turbo: {
      enabled: false
    }
  }
};

module.exports = nextConfig; 