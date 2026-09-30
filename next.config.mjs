/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["firebase-admin", "jwks-rsa", "jose"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "plus.unsplash.com",
      },
    ],
  },
  outputFileTracingExcludes: {
    '*': [
      'node_modules/@swc/core/**',
      'node_modules/@esbuild/**',
      'node_modules/esbuild/**',
      'node_modules/@playwright/**',
      'node_modules/playwright/**',
      'node_modules/vitest/**',
      'node_modules/@testing-library/**',
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
    serverComponentsExternalPackages: ['@resvg/resvg-js', 'pdfkit'],
  },
};

export default nextConfig;
