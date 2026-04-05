/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { domains: ['localhost'] },
  experimental: { serverActions: { allowedOrigins: ['localhost:3000'] } },
}
export default nextConfig
