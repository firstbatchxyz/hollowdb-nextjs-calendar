/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        fs: false, // added for SnarkJS
        readline: false, // added for SnarkJS
      };
    }
    // added to run WASM for SnarkJS
    config.experiments = { asyncWebAssembly: true };
    return config;
  },
};

module.exports = nextConfig;
