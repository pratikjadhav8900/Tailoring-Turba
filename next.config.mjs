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
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "*.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
    ],
  },
  experimental: {
    outputFileTracingExcludes: {
      '*': [
        'node_modules/@swc/core/**',
        'node_modules/@esbuild/**',
        'node_modules/esbuild/**',
        'node_modules/@playwright/**',
        'node_modules/playwright/**',
        'node_modules/vitest/**',
        'node_modules/@testing-library/**',
        // sharp/resvg ship one prebuilt native binary per OS+arch; only the
        // linux-x64-gnu one Vercel's runtime actually uses should ever be bundled.
        'node_modules/@img/sharp-darwin-*/**',
        'node_modules/@img/sharp-win32-*/**',
        'node_modules/@img/sharp-linuxmusl-*/**',
        'node_modules/@img/sharp-linux-arm*/**',
        'node_modules/@resvg/resvg-js-darwin-*/**',
        'node_modules/@resvg/resvg-js-win32-*/**',
        'node_modules/@resvg/resvg-js-linux-*-musl/**',
        'node_modules/@resvg/resvg-js-linux-arm*/**',
      ],
    },
    serverActions: {
      bodySizeLimit: "2mb",
    },
    serverComponentsExternalPackages: ['@resvg/resvg-js', 'pdfkit', 'sharp', 'satori'],
  },
};

export default nextConfig;
