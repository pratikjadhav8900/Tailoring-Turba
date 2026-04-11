import { NextRequest, NextResponse } from "next/server";
import { cloudinary } from "@/lib/cloudinary";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File;
  const isRaw = formData.get("isRaw") === "true";

  if (!file) return NextResponse.json({ error: "No file provided." }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = file.name.split(".").pop()?.toLowerCase();
  const rawTypes = ["cdr", "ai", "eps", "psd", "pdf"];
  const useRaw = isRaw || rawTypes.includes(ext ?? "");

  return new Promise((resolve) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        public_id: `tailoringturba/uploads/${session.user!.id}/${Date.now()}_${file.name}`,
        resource_type: useRaw ? "raw" : "auto",
      },
      (error, result) => {
        if (error || !result) {
          resolve(NextResponse.json({ error: "Upload failed." }, { status: 500 }));
        } else {
          resolve(NextResponse.json({ url: result.secure_url, publicId: result.public_id }));
        }
      }
    );
    uploadStream.end(buffer);
  });
}
