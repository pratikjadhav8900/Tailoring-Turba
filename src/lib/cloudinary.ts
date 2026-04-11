import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export { cloudinary };

export function getCataloguePageUrl(pageNumber: number): string {
  const padded = String(pageNumber).padStart(2, '0');
  // Use local storage instead of Cloudinary as requested
  return `/catalogue/pages/page-${padded}.jpg`;
}
