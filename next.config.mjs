/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  images: {
    domains: ['lh3.googleusercontent.com', 'arweave.net', 'ipfs.io', 'storage.opensea.io', 'res.cloudinary.com', 'openseauserdata.com'],
  },
  webpack: (config) => {
    config.externals.push({
      "utf-8-validate": "commonjs utf-8-validate",
      bufferutil: "commonjs bufferutil",
      canvas: "commonjs canvas",  
    });
    config.externals.push('pino-pretty', 'lokijs', 'encoding')
    // config.infrastructureLogging = { debug: /PackFileCache/ };
    return config;
  },
};

export default nextConfig;
  