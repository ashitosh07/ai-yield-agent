/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.fallback = { fs: false, net: false, tls: false };
    return config;
  },
  swcMinify: false,
  // Fix Windows permission issue by binding to localhost only
  experimental: {
    serverComponentsExternalPackages: []
  }
}

module.exports = nextConfig