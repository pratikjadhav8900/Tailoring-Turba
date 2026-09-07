export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { sendMail } from "@/lib/mail";
import { prisma, withRetry } from "@/lib/prisma";
import { sanitize } from "@/lib/sanitize";
import { checkRateLimit } from "@/lib/rate-limit";
import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

interface ResumeFilePayload {
  name: string;
  type: string;
  base64: string;
}

export async function POST(req: NextRequest) {
  try {
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";

    // 1. IP-level rate limiting (max 5 career applications per 15 minutes)
    const rateLimit = checkRateLimit(`career_submission_${clientIp}`, 5, 15 * 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many applications submitted. Please try again later." },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
      );
    }

    let { name, email, phone, position, resumeFile, message } = await req.json();

    if (!name || !email || !phone || !position || !resumeFile || !resumeFile.base64) {
      return NextResponse.json({ error: "Name, email, phone, position and resume file are required." }, { status: 400 });
    }

    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phone)) {
      return NextResponse.json({ error: "Please enter a valid 10-digit phone number." }, { status: 400 });
    }

    // 2. Sanitize text inputs
    name = sanitize(name);
    email = sanitize(email);
    phone = sanitize(phone);
    position = sanitize(position);
    message = message ? sanitize(message) : "";

    // 3. Payload size check
    if (typeof resumeFile.base64 !== "string" || resumeFile.base64.length > 7 * 1024 * 1024) {
      return NextResponse.json({ error: "Resume file exceeds maximum allowable size (5MB)." }, { status: 400 });
    }

    // Convert Base64 to Buffer
    const fileBase64String = resumeFile.base64.split(",")[1] || resumeFile.base64;
    const fileBuffer = Buffer.from(fileBase64String, "base64");

    if (fileBuffer.length > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "Resume file exceeds maximum 5MB size limit." }, { status: 400 });
    }
    if (fileBuffer.length < 50) {
      return NextResponse.json({ error: "Invalid resume file: file is empty." }, { status: 400 });
    }

    // 4. Magic-Byte Validation (PDF or DOCX only)
    const isPdf = fileBuffer.subarray(0, 4).toString("utf8") === "%PDF";
    const isDocx = fileBuffer[0] === 0x50 &&
                   fileBuffer[1] === 0x4b &&
                   fileBuffer[2] === 0x03 &&
                   fileBuffer[3] === 0x04 &&
                   String(resumeFile.name || "").toLowerCase().endsWith(".docx");

    if (!isPdf && !isDocx) {
      return NextResponse.json(
        { error: "Invalid resume format. Only genuine PDF and DOCX files are accepted." },
        { status: 400 }
      );
    }

    // 5. Sanitize filename
    const cleanExt = isPdf ? ".pdf" : ".docx";
    const rawFileName = sanitize(resumeFile.name || `resume${cleanExt}`);
    const safeBaseName = rawFileName
      .replace(/\.[^/.]+$/, "")
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .slice(0, 40);
    const sanitizedFileName = `${safeBaseName || "resume"}${cleanExt}`;

    // 6. Upload as raw document (resource_type: "raw") to prevent script execution
    let resumeUrl = "";
    try {
      if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) {
        const uploadResult: any = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: "kraftx_resumes",
              resource_type: "raw",
              public_id: `${name.replace(/[^a-zA-Z0-9]/g, "_")}_resume_${Date.now()}${cleanExt}`,
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          uploadStream.end(fileBuffer);
        });
        resumeUrl = uploadResult?.secure_url || "";
      } else {
        resumeUrl = "attached_to_email_only";
      }
    } catch (uploadError) {
      console.error("[CLOUDINARY_RESUME_UPLOAD_FAILED]", uploadError);
      resumeUrl = "attached_to_email_only_upload_error";
    }

    // 7. Save to Database as an Inquiry with "Career Application" company name
    await withRetry(async () => {
      await prisma.inquiry.create({
        data: {
          name,
          email,
          phone,
          companyName: "Career Application",
          quantity: 0,
          requirements: `Applied Position: ${position}\nResume File Name: ${sanitizedFileName}\nResume Link: ${resumeUrl}\nCover Letter: ${message || "None provided"}`,
        }
      });
    });

    // 8. Alert operations/HR team
    const hrHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <div style="background: #6b7d60; padding: 24px; border-radius: 6px 6px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 22px; letter-spacing: 1px;">TAILORING TURBA CAREERS</h1>
        </div>
        <h2 style="color: #6b7d60; margin-top: 20px; border-bottom: 2px solid #6b7d60; padding-bottom: 8px;">💼 New Career Application</h2>
        <p style="color: #555; font-size: 14px;">A candidate has applied via the Careers portal. The uploaded resume is attached to this email.</p>
        <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
          <tr>
            <td style="padding: 8px 0; font-weight: 700; width: 150px; color: #555;">Candidate Name:</td>
            <td style="padding: 8px 0;">${name}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: 700; color: #555;">Email Address:</td>
            <td style="padding: 8px 0;"><a href="mailto:${email}" style="color: #6b7d60;">${email}</a></td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: 700; color: #555;">Phone Number:</td>
            <td style="padding: 8px 0;"><a href="tel:${phone}" style="color: #6b7d60;">${phone}</a></td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: 700; color: #555;">Applied Position:</td>
            <td style="padding: 8px 0; font-weight: bold; color: #0f172a;">${position}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: 700; color: #555;">Resume Filename:</td>
            <td style="padding: 8px 0; font-family: monospace;">${sanitizedFileName}</td>
          </tr>
          ${resumeUrl.startsWith("http") ? `
          <tr>
            <td style="padding: 8px 0; font-weight: 700; color: #555;">Document URL:</td>
            <td style="padding: 8px 0;"><a href="${resumeUrl}" target="_blank" style="color: #c49d32; text-decoration: underline; font-weight: bold;">Download Resume ↗</a></td>
          </tr>
          ` : ""}
          <tr>
            <td style="padding: 8px 0; font-weight: 700; color: #555; vertical-align: top;">Cover Letter:</td>
            <td style="padding: 8px 0; white-space: pre-wrap; color: #444; line-height: 1.6;">${message || "No cover letter provided."}</td>
          </tr>
        </table>
      </div>
    `;

    // Send email with sanitized file attached
    await sendMail({
      to: "tailoringturba@gmail.com",
      subject: `[CAREER APPLICATION] ${name} — ${position}`,
      html: hrHtml,
      attachments: [
        {
          filename: sanitizedFileName,
          content: fileBuffer,
          contentType: isPdf ? "application/pdf" : "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        }
      ]
    });

    return NextResponse.json({ success: true, message: "Application submitted successfully." });
  } catch (error: any) {
    console.error("[CAREERS_SUBMISSION_ERROR]", error);
    return NextResponse.json({ error: "Failed to process application. Please try again later." }, { status: 500 });
  }
}
