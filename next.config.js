/** @type {import('next').NextConfig} */
const nextConfig = {
  // No external image domains needed in demo mode
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig
