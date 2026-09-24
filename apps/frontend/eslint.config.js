/** @type {import('next').Next.jsConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8000/api/:path*', // Aapke backend ka URL
      },
    ];
  },
};

node.exports = nextConfig; // Ya agar .mjs hai toh export default nextConfig;