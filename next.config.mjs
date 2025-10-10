/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  devIndicators: {
    devtools: false,
  },
  webpack: (config) => {
    // Suppress Supabase Realtime warnings
    config.ignoreWarnings = [
      /Critical dependency: the request of a dependency is an expression/,
    ]
    return config
  },
}

export default nextConfig
