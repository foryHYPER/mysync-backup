/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  experimental: {
    turbo: {
      rules: {
        // Turbopack rules configuration
      },
    },
  },
  // Basic optimizations
  swcMinify: true,
  optimizeFonts: true,
  // Ensure CSS is properly loaded
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Configure asset prefix for production
  assetPrefix: process.env.NODE_ENV === 'production' ? undefined : undefined,
  // Configure image optimization
  images: {
    domains: [],
    unoptimized: process.env.NODE_ENV === 'development',
  },
  // Configure CSS modules
  cssModules: true,
  // Configure PostCSS
  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },
  // Ensure CSS is properly processed
  webpack: (config) => {
    // Add CSS processing rules
    config.module.rules.push({
      test: /\.css$/i,
      use: [
        'style-loader',
        {
          loader: 'css-loader',
          options: {
            importLoaders: 1,
            modules: {
              auto: true,
              localIdentName: '[name]__[local]--[hash:base64:5]',
            },
          },
        },
        'postcss-loader',
      ],
    });
    return config;
  },
  // Ensure CSS is properly loaded in development
  onDemandEntries: {
    // period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 25 * 1000,
    // number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 2,
  },
};

module.exports = nextConfig; 