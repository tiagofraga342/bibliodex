/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // Important for Docker builds with output file tracing
};

export default nextConfig;
