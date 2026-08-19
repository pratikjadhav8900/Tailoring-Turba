export const dynamic = 'force-dynamic';
import { v2 as cloudinary } from "cloudinary";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

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
                { width: 1000, height: 1000, crop: "fill", gravity: "auto", quality: "auto", fetch_format: "auto" }
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
        console.warn("[Upload] Cloudinary upload failed, using local filesystem fallback:", cloudErr);
      }
    }

    // Local filesystem fallback: Save to public/uploads
    if (!secureUrl) {
      const fs = await import("fs/promises");
      const path = await import("path");
      const uploadsDir = path.join(process.cwd(), "public", "uploads");
      await fs.mkdir(uploadsDir, { recursive: true });

      const rawExt = path.extname(file.name) || ".png";
      const safeExt = rawExt.toLowerCase();
      const filename = `asset-${Date.now()}-${Math.random().toString(36).substring(2, 8)}${safeExt}`;
      const filePath = path.join(uploadsDir, filename);

      await fs.writeFile(filePath, buffer);

      secureUrl = `/uploads/${filename}`;
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
    console.error("Cloudinary Upload Error Details:", {
      message: error.message,
      http_code: error.http_code,
      name: error.name
    });
    return NextResponse.json({ error: "Upload failed", details: error.message }, { status: 500 });
  }
}

