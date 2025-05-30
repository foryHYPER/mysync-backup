/** @type {import('next').NextConfig} */
const nextConfig = {
  // Basic optimizations
  swcMinify: true,
  optimizeFonts: true,
  // Configure output for server-side rendering
  output: 'standalone',
  // Disable image optimization
  images: {
    unoptimized: true,
  },
  // Enable source maps for better debugging
  productionBrowserSourceMaps: true,
};

module.exports = nextConfig; 