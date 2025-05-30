/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable Turbo for now to ensure stable CSS loading
  experimental: {
    turbo: false,
  },
  // Enable strict mode for better development experience
  reactStrictMode: true,
  // Ensure proper asset handling
  images: {
    unoptimized: true,
  },
  // Configure PostCSS
  postcss: {
    plugins: {
      'tailwindcss': {},
      'autoprefixer': {},
    },
  },
  // Ensure proper CSS loading
  compiler: {
    styledComponents: true,
  },
  // Configure output
  output: 'standalone',
  // Configure asset prefix
  assetPrefix: process.env.NODE_ENV === 'production' ? undefined : '',
  // Enable source maps for better debugging
  productionBrowserSourceMaps: true,
};

module.exports = nextConfig; 