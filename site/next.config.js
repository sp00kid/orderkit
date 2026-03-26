/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["orderkit"],
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      orderkit: require("path").resolve(__dirname, "../src/index.tsx"),
    };
    return config;
  },
};

module.exports = nextConfig;
