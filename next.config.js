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
  // Ensure CSS is properly loaded
  webpack: (config) => {
    config.module.rules.push({
      test: /\.css$/,
      use: ['style-loader', 'css-loader', 'postcss-loader'],
    });
    return config;
  },
};

module.exports = nextConfig; 