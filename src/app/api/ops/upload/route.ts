import { NextRequest, NextResponse } from "next/server";
import { requireOpsAuth } from "@/lib/ops/auth";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const MAX_OPS_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25MB

const ALLOWED_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".svg",
  ".pdf",
  ".cdr",
  ".ai",
  ".eps",
  ".psd",
  ".zip",
]);

export async function POST(req: NextRequest) {
  const auth = await requireOpsAuth();
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No asset file provided." }, { status: 400 });
    }

    if (file.size > MAX_OPS_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: "Asset file exceeds 25MB limit. Please upload a compressed vector or file." },
        { status: 400 }
      );
    }

    const originalName = file.name || "asset";
    const extMatch = originalName.match(/\.([0-9a-z]+)$/i);
    const ext = extMatch ? `.${extMatch[1].toLowerCase()}` : "";

    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return NextResponse.json(
        {
          error: `Unsupported file extension (${ext}). Allowed: PNG, JPG, WEBP, SVG, PDF, CDR, AI, EPS, PSD, ZIP.`,
        },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 1. Try Cloudinary if configured
    const isCloudinaryConfigured = Boolean(
      process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET &&
        process.env.CLOUDINARY_CLOUD_NAME !== "[SENSITIVE]"
    );

    let secureUrl = "";
    if (isCloudinaryConfigured) {
      try {
        const isVectorOrRaw = [".cdr", ".ai", ".eps", ".psd", ".zip"].includes(ext);
        const result: any = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: "ops_production_assets",
              resource_type: isVectorOrRaw ? "raw" : "auto",
              use_filename: true,
              unique_filename: true,
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
        console.warn("[OpsUpload] Cloudinary upload failed, falling back to local storage:", cloudErr);
      }
    }

    // 2. Local public fallback
    if (!secureUrl) {
      const publicUploadsDir = path.join(process.cwd(), "public", "uploads", "ops-assets");
      await fs.mkdir(publicUploadsDir, { recursive: true });

      const sanitizedBase = originalName
        .replace(/[^a-zA-Z0-9._-]/g, "_")
        .replace(new RegExp(`\\${ext}$`), "");
      const safeFilename = `${sanitizedBase}-${Date.now()}${ext}`;
      const filePath = path.join(publicUploadsDir, safeFilename);

      await fs.writeFile(filePath, buffer);
      secureUrl = `/uploads/ops-assets/${safeFilename}`;
    }

    return NextResponse.json({
      success: true,
      asset: {
        url: secureUrl,
        fileName: originalName,
        fileSize: file.size,
        fileType: ext.replace(".", "").toUpperCase(),
      },
    });
  } catch (error: any) {
    console.error("[OpsUpload] Error handling asset upload:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload production asset" },
      { status: 500 }
    );
  }
}
