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

    // Upload to Cloudinary
    const result: any = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "kraftx_customizations",
          resource_type: "auto",
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(buffer);
    });

    const session = await auth();
    if (session?.user?.id && result?.secure_url) {
      try {
        await prisma.userAsset.create({
          data: {
            userId: session.user.id,
            url: result.secure_url,
          },
        });
      } catch (dbErr) {
        console.error("Failed to save asset to user account:", dbErr);
      }
    }

    return NextResponse.json({ 
      url: result.secure_url,
      public_id: result.public_id 
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

