import { NextRequest, NextResponse } from "next/server";
import { requireOpsAuth } from "@/lib/ops/auth";
import {
  parseQuotationText,
  parseQuotationWithGemini,
} from "@/lib/ops/quotation-parser";

export const dynamic = "force-dynamic";

/**
 * Safe PDF text extractor using pdf-parse/lib/pdf-parse.js directly
 * to avoid index.js debug execution issues in ES/Webpack bundles.
 */
async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  try {
    const { default: pdfParse } = await import("pdf-parse/lib/pdf-parse.js");
    const data = await pdfParse(buffer);
    return data?.text || "";
  } catch (err) {
    console.warn("[QuotationParse] Failed to parse PDF text:", err);
    return "";
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireOpsAuth();
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const contentType = req.headers.get("content-type") || "";

    // 1. JSON payload with pre-extracted or pasted text
    if (contentType.includes("application/json")) {
      const body = await req.json();
      const rawText = body.text || body.rawText;

      if (rawText && typeof rawText === "string" && rawText.trim().length > 10) {
        const quotation = parseQuotationText(rawText);
        return NextResponse.json({ success: true, quotation });
      }

      if (body.base64 && body.mimeType) {
        const buffer = Buffer.from(body.base64, "base64");
        if (body.mimeType === "application/pdf") {
          const pdfText = await extractTextFromPdf(buffer);
          if (pdfText && pdfText.trim().length > 20) {
            const quotation = parseQuotationText(pdfText);
            return NextResponse.json({ success: true, quotation });
          }
        }

        const geminiResult = await parseQuotationWithGemini(buffer, body.mimeType);
        if (geminiResult) {
          return NextResponse.json({ success: true, quotation: geminiResult });
        }
      }

      return NextResponse.json(
        { error: "No quotation text or valid document provided in JSON body." },
        { status: 400 }
      );
    }

    // 2. FormData file upload (PDF or Image)
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      const textParam = formData.get("text") as string | null;

      if (textParam && textParam.trim().length > 10) {
        const quotation = parseQuotationText(textParam);
        return NextResponse.json({ success: true, quotation });
      }

      if (!file) {
        return NextResponse.json(
          { error: "No quotation file attached. Please upload a PDF or image." },
          { status: 400 }
        );
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const mimeType = file.type || "application/octet-stream";
      const originalFileName = (file.name || "").toLowerCase();
      // Persist the uploaded quotation document to public/uploads/quotations for long-term audit & viewing
      let fileUrl = "";
      try {
        const fs = await import("fs/promises");
        const path = await import("path");
        const uploadsDir = path.join(process.cwd(), "public", "uploads", "quotations");
        await fs.mkdir(uploadsDir, { recursive: true });

        const safeBaseName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
        const savedFilename = `quote-${Date.now()}-${safeBaseName}`;
        const filePath = path.join(uploadsDir, savedFilename);
        await fs.writeFile(filePath, buffer);
        fileUrl = `/uploads/quotations/${savedFilename}`;
      } catch (saveErr) {
        console.warn("[QuotationParse] Failed to persist quotation file to disk:", saveErr);
      }

      // Check if file is PDF
      const isPdf =
        mimeType === "application/pdf" ||
        originalFileName.endsWith(".pdf") ||
        (buffer.length >= 4 &&
          buffer[0] === 0x25 &&
          buffer[1] === 0x50 &&
          buffer[2] === 0x44 &&
          buffer[3] === 0x46);

      if (isPdf) {
        const pdfText = await extractTextFromPdf(buffer);
        if (pdfText && pdfText.trim().length > 20) {
          const quotation = parseQuotationText(pdfText);
          return NextResponse.json({
            success: true,
            quotation,
            fileUrl: fileUrl || undefined,
            fileName: file.name,
            fileSize: file.size,
            source: "PDF_NATIVE_TEXT",
          });
        }

        // If native PDF text is blank (scanned PDF), try Gemini Vision
        const geminiResult = await parseQuotationWithGemini(buffer, "application/pdf");
        if (geminiResult) {
          return NextResponse.json({
            success: true,
            quotation: geminiResult,
            fileUrl: fileUrl || undefined,
            fileName: file.name,
            fileSize: file.size,
            source: "AI_VISION",
          });
        }

        return NextResponse.json(
          {
            error:
              "Could not extract text from this PDF. If this is a photo/scanned paper quote without text, please copy the text or configure Gemini Vision.",
            fileUrl: fileUrl || undefined,
            fileName: file.name,
          },
          { status: 422 }
        );
      }

      // If file is Image (PNG, JPEG, WebP)
      const isImage =
        mimeType.startsWith("image/") ||
        originalFileName.endsWith(".png") ||
        originalFileName.endsWith(".jpg") ||
        originalFileName.endsWith(".jpeg") ||
        originalFileName.endsWith(".webp");

      if (isImage) {
        const effectiveMime = mimeType.startsWith("image/") ? mimeType : "image/jpeg";
        const geminiResult = await parseQuotationWithGemini(buffer, effectiveMime);
        if (geminiResult) {
          return NextResponse.json({
            success: true,
            quotation: geminiResult,
            fileUrl: fileUrl || undefined,
            fileName: file.name,
            fileSize: file.size,
            source: "AI_VISION",
          });
        }

        return NextResponse.json(
          {
            error:
              "Image uploaded, but AI Vision (GEMINI_API_KEY) is not configured in your environment. You can upload a PDF quotation directly (works 100% offline) or paste the quotation text into the modal.",
            fileUrl: fileUrl || undefined,
            fileName: file.name,
          },
          { status: 422 }
        );
      }

      return NextResponse.json(
        {
          error:
            "Unsupported file type. Please upload a PDF quotation (.pdf) or image (.png, .jpg).",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Invalid Content-Type header. Expected multipart/form-data or application/json." },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("[QuotationParse] Exception:", error);
    return NextResponse.json(
      { error: error.message || "Failed to parse quotation document" },
      { status: 500 }
    );
  }
}
