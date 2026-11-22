import { NextRequest, NextResponse } from "next/server";
import { requireCrmAuth } from "@/lib/crm/auth";
import { prisma } from "@/lib/prisma";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp"]);

export async function POST(req: NextRequest) {
  const auth = await requireCrmAuth();
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No image file provided." }, { status: 400 });
    }
    if (file.size > MAX_AVATAR_SIZE_BYTES) {
      return NextResponse.json({ error: "Image exceeds 5MB limit." }, { status: 400 });
    }

    const originalName = file.name || "avatar";
    const extMatch = originalName.match(/\.([0-9a-z]+)$/i);
    const ext = extMatch ? `.${extMatch[1].toLowerCase()}` : "";
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return NextResponse.json({ error: "Only PNG, JPG, or WEBP images are allowed." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const isCloudinaryConfigured = Boolean(
      process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET &&
        process.env.CLOUDINARY_CLOUD_NAME !== "[SENSITIVE]"
    );

    let secureUrl = "";
    if (isCloudinaryConfigured) {
      try {
        const result: any = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: "crm_avatars",
              resource_type: "image",
              transformation: [{ width: 256, height: 256, crop: "fill", gravity: "face" }],
              public_id: `employee_${auth.context.employee.id}`,
              overwrite: true,
            },
            (error, res) => {
              if (error) reject(error);
              else resolve(res);
            }
          );
          uploadStream.end(buffer);
        });
        secureUrl = result.secure_url;
      } catch (cloudErr) {
        console.warn("[CrmAvatarUpload] Cloudinary upload failed, falling back to local storage:", cloudErr);
      }
    }

    if (!secureUrl) {
      const publicUploadsDir = path.join(process.cwd(), "public", "uploads", "crm-avatars");
      await fs.mkdir(publicUploadsDir, { recursive: true });
      const safeFilename = `employee_${auth.context.employee.id}-${Date.now()}${ext}`;
      await fs.writeFile(path.join(publicUploadsDir, safeFilename), buffer);
      secureUrl = `/uploads/crm-avatars/${safeFilename}`;
    }

    if (auth.context.employee.userId) {
      await prisma.user.update({
        where: { id: auth.context.employee.userId },
        data: { image: secureUrl },
      });
    }

    return NextResponse.json({ success: true, url: secureUrl });
  } catch (error: any) {
    console.error("[CrmAvatarUpload] Error handling avatar upload:", error);
    return NextResponse.json({ error: error.message || "Failed to upload photo" }, { status: 500 });
  }
}
