import { v2 as cloudinary } from "cloudinary";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";

export const dynamic = 'force-dynamic';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Maximum file size: 15MB
const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024;

// Magic byte signature validation
function validateMagicBytes(buffer: Buffer): { isValid: boolean; detectedMime?: string } {
  if (buffer.length < 4) return { isValid: false };

  // PNG: 89 50 4E 47
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return { isValid: true, detectedMime: "image/png" };
  }

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { isValid: true, detectedMime: "image/jpeg" };
  }

  // WEBP: RIFF .... WEBP
  if (
    buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
    buffer.length >= 12 &&
    buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
  ) {
    return { isValid: true, detectedMime: "image/webp" };
  }

  // PDF: %PDF- (25 50 44 46)
  if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
    return { isValid: true, detectedMime: "application/pdf" };
  }

  return { isValid: false };
}

export async function POST(request: Request) {
  try {
    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    
    // 1. Rate Limiting: Max 20 uploads per 10 minutes per IP
    const rateLimit = checkRateLimit(`upload_ip_${clientIp}`, 20, 10 * 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many upload requests. Please try again in a few minutes." },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // 2. File Size Validation
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: "File size exceeds the 15MB limit. Please upload a smaller file." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 3. MIME & Magic Byte Validation
    const magic = validateMagicBytes(buffer);
    if (!magic.isValid || !magic.detectedMime) {
      return NextResponse.json(
        { error: "Invalid or unsupported file format. Allowed formats: PNG, JPEG, WebP, PDF." },
        { status: 400 }
      );
    }

    // Check if Cloudinary is fully configured with real credentials
    const isCloudinaryConfigured = Boolean(
      process.env.CLOUDINARY_CLOUD_NAME && 
      process.env.CLOUDINARY_CLOUD_NAME !== "[SENSITIVE]" &&
      process.env.CLOUDINARY_API_KEY && 
      process.env.CLOUDINARY_API_KEY !== "[SENSITIVE]" &&
      process.env.CLOUDINARY_API_SECRET &&
      process.env.CLOUDINARY_API_SECRET !== "[SENSITIVE]"
    );

    let secureUrl = "";
    let publicId = "";

    if (isCloudinaryConfigured) {
      try {
        const result: any = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: "kraftx_customizations",
              resource_type: "auto",
              transformation: [
                { width: 1600, height: 1600, crop: "limit", quality: "auto", fetch_format: "auto" }
              ]
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          uploadStream.end(buffer);
        });

        secureUrl = result.secure_url;
        publicId = result.public_id;
      } catch (cloudErr) {
        console.warn("[Upload] Cloudinary upload failed, using secure private filesystem fallback:", cloudErr);
      }
    }

    // 4. Secure Private Filesystem Fallback: Save outside public web root
    if (!secureUrl) {
      const fs = await import("fs/promises");
      const path = await import("path");
      
      // Store in private-uploads (not directly accessible over HTTP static routing)
      const uploadsDir = path.join(process.cwd(), "private-uploads");
      await fs.mkdir(uploadsDir, { recursive: true });

      const safeExt = magic.detectedMime === "image/png" ? ".png" :
                      magic.detectedMime === "image/jpeg" ? ".jpg" :
                      magic.detectedMime === "image/webp" ? ".webp" : ".pdf";
      const filename = `asset-${Date.now()}-${Math.random().toString(36).substring(2, 8)}${safeExt}`;
      const filePath = path.join(uploadsDir, filename);

      await fs.writeFile(filePath, buffer);

      // Access gateway via authenticated endpoint
      secureUrl = `/api/user-assets/${filename}`;
      publicId = filename;
    }

    const session = await auth();
    const isLogo = formData.get("isLogo") === "true";

    if (session?.user?.id && secureUrl && isLogo) {
      try {
        await prisma.userAsset.create({
          data: {
            userId: session.user.id,
            url: secureUrl,
          },
        });
      } catch (dbErr) {
        console.error("Failed to save asset to user account:", dbErr);
      }
    }

    return NextResponse.json({ 
      url: secureUrl,
      public_id: publicId 
    });

  } catch (error: any) {
    console.error("[UPLOAD] Upload failed:", {
      message: error?.message,
      http_code: error?.http_code,
    });
    return NextResponse.json(
      { error: "Upload failed. Please ensure the file is a valid image/PDF and try again." },
      { status: 500 }
    );
  }
}

