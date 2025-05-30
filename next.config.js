/** @type {import('next').NextConfig} */
const nextConfig = {
  // Basic optimizations
  swcMinify: true,
  optimizeFonts: true,
  // Configure output for static export
  output: 'export',
  // Disable image optimization
  images: {
    unoptimized: true,
  },
  // Enable source maps for better debugging
  productionBrowserSourceMaps: true,
};

module.exports = nextConfig; 