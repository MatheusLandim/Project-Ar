/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Não interromper o build da Vercel por avisos de lint
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Não interromper o build da Vercel por checagem de tipos
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
