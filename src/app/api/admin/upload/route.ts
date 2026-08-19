export const dynamic = 'force-dynamic';
import { v2 as cloudinary } from "cloudinary";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

    if (isCloudinaryConfigured) {
      try {
        const result: any = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: "kraftx_products",
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

        return NextResponse.json({ 
          url: result.secure_url,
          public_id: result.public_id 
        });
      } catch (cloudErr) {
        console.warn("[Upload] Cloudinary upload failed, using local filesystem fallback:", cloudErr);
      }
    }

    // Local filesystem fallback: Save to public/uploads
    const fs = await import("fs/promises");
    const path = await import("path");
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadsDir, { recursive: true });

    const rawExt = path.extname(file.name) || ".png";
    const safeExt = rawExt.toLowerCase();
    const filename = `prod-${Date.now()}-${Math.random().toString(36).substring(2, 8)}${safeExt}`;
    const filePath = path.join(uploadsDir, filename);

    await fs.writeFile(filePath, buffer);

    return NextResponse.json({ 
      url: `/uploads/${filename}`,
      public_id: filename 
    });

  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

