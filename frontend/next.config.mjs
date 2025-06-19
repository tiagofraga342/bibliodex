/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // Important for Docker builds with output file tracing
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://backend:8000/:path*', // Proxy to backend in Docker
      },
    ];
  },
};

export default nextConfig;
