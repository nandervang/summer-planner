/** @type {import('next').NextConfig} */
const nextConfig = {
  // Add this to ensure proper handling of API routes
  async headers() {
    return [
      {
        source: "/api/auth/:path*",
        headers: [{ key: "Cache-Control", value: "no-store, max-age=0" }],
      },
    ]
  },
  // Add your custom domain to the list of domains
  images: {
    domains: ["nandervang.vercel.app"],
  },
}

module.exports = nextConfig

