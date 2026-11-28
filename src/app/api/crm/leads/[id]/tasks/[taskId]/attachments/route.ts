import { NextRequest, NextResponse } from "next/server";
import { requireCrmAuth } from "@/lib/crm/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  MAX_ATTACHMENT_SIZE_BYTES,
  uploadAttachmentToCloudinary,
  validateAttachmentMagicBytes,
} from "@/lib/attachments";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; taskId: string } }
) {
  const auth = await requireCrmAuth();
  if (auth.errorResponse) return auth.errorResponse;

  const rateLimit = checkRateLimit(`crm_task_attachment_${auth.context.employee.id}`, 20, 10 * 60 * 1000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many uploads. Please try again in a few minutes." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
      return NextResponse.json({ error: "File exceeds the 15MB limit." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const magic = validateAttachmentMagicBytes(buffer);
    if (!magic.isValid) {
      return NextResponse.json(
        { error: "Invalid or unsupported file format. Allowed: PNG, JPEG, WebP, PDF." },
        { status: 400 }
      );
    }

    const { url } = await uploadAttachmentToCloudinary(buffer, "crm_task_attachments");
    return NextResponse.json({ success: true, url });
  } catch (error: any) {
    console.error("[CRM_TASK_ATTACHMENT_UPLOAD_ERROR]", error);
    return NextResponse.json({ error: error.message || "Upload failed" }, { status: 500 });
  }
}
