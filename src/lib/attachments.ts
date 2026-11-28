import { cloudinary } from "@/lib/cloudinary";

export const MAX_ATTACHMENT_SIZE_BYTES = 15 * 1024 * 1024;

interface MagicByteResult {
  isValid: boolean;
  detectedMime?: string;
}

/** Same signatures accepted by the public /api/upload route (PNG/JPEG/WEBP/PDF). */
export function validateAttachmentMagicBytes(buffer: Buffer): MagicByteResult {
  if (buffer.length < 4) return { isValid: false };

  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return { isValid: true, detectedMime: "image/png" };
  }
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { isValid: true, detectedMime: "image/jpeg" };
  }
  if (
    buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
    buffer.length >= 12 &&
    buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
  ) {
    return { isValid: true, detectedMime: "image/webp" };
  }
  if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
    return { isValid: true, detectedMime: "application/pdf" };
  }

  return { isValid: false };
}

/**
 * Uploads a validated internal-tool attachment (quotation PDFs, etc.) to
 * Cloudinary. Unlike the public customizer upload route, this throws instead
 * of silently falling back to local disk — Vercel's filesystem is read-only
 * in production, so a silent fallback there means the file is simply lost
 * (see PROJECT_CONTEXT.md's note on the old /api/ops/quotation/parse bug).
 */
export async function uploadAttachmentToCloudinary(
  buffer: Buffer,
  folder: string
): Promise<{ url: string; publicId: string }> {
  const isConfigured = Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
  if (!isConfigured) {
    throw new Error("File storage is not configured. Contact an admin before uploading attachments.");
  }

  const result: any = await new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "auto" },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    uploadStream.end(buffer);
  });

  return { url: result.secure_url, publicId: result.public_id };
}
