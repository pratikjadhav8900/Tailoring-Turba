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
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
    serverComponentsExternalPackages: ['@resvg/resvg-js', 'pdfkit'],
  },
};

export default nextConfig;
