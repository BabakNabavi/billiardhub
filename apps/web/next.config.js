/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@repo/ui"],
  serverExternalPackages: ["bcrypt"],
};

export default nextConfig;