/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  cacheComponents: false,
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
