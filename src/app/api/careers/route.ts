export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { sendMail } from "@/lib/mail";
import { prisma, withRetry } from "@/lib/prisma";
import { sanitize } from "@/lib/sanitize";
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
    let { name, email, phone, position, resumeFile, message } = await req.json();

    if (!name || !email || !phone || !position || !resumeFile || !resumeFile.base64) {
      return NextResponse.json({ error: "Name, email, phone, position and resume file are required." }, { status: 400 });
    }

    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phone)) {
      return NextResponse.json({ error: "Please enter a valid 10-digit phone number." }, { status: 400 });
    }

    // Sanitize text inputs
    name = sanitize(name);
    email = sanitize(email);
    phone = sanitize(phone);
    position = sanitize(position);
    if (message) {
      message = sanitize(message);
    } else {
      message = "";
    }

    // Convert Base64 file string to Buffer
    const fileBase64String = resumeFile.base64.split(",")[1] || resumeFile.base64;
    const fileBuffer = Buffer.from(fileBase64String, "base64");

    // Upload to Cloudinary to generate a permanent link for DB storage
    let resumeUrl = "";
    try {
      if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) {
        const uploadResult: any = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: "kraftx_resumes",
              resource_type: "auto", // auto detects PDFs/Word Docs
              public_id: `${name.replace(/\s+/g, "_")}_resume_${Date.now()}`
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
      console.error("Cloudinary resume upload failed, falling back to email attachment only:", uploadError);
      resumeUrl = "attached_to_email_only_upload_error";
    }

    // Save to Database as an Inquiry with "Career Application" company name
    await withRetry(async () => {
      await prisma.inquiry.create({
        data: {
          name,
          email,
          phone,
          companyName: "Career Application",
          quantity: 0,
          requirements: `Applied Position: ${position}\nResume File Name: ${resumeFile.name}\nResume Link: ${resumeUrl}\nCover Letter: ${message || "None provided"}`
        }
      });
    });

    // Alert operations/HR team
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
            <td style="padding: 8px 0; font-family: monospace;">${resumeFile.name}</td>
          </tr>
          ${resumeUrl.startsWith("http") ? `
          <tr>
            <td style="padding: 8px 0; font-weight: 700; color: #555;">Database URL:</td>
            <td style="padding: 8px 0;"><a href="${resumeUrl}" target="_blank" style="color: #c49d32; text-decoration: underline; font-weight: bold;">Download from Cloudinary ↗</a></td>
          </tr>
          ` : ""}
          <tr>
            <td style="padding: 8px 0; font-weight: 700; color: #555; vertical-align: top;">Cover Letter:</td>
            <td style="padding: 8px 0; white-space: pre-wrap; color: #444; line-height: 1.6;">${message || "No cover letter provided."}</td>
          </tr>
        </table>
        <div style="margin-top: 25px; padding: 12px; background: #fafaf8; border-left: 4px solid #c49d32; border-radius: 4px; font-size: 13px; color: #6b6b65;">
          This application has been successfully logged in the database under Inquiry submissions with the company name "Career Application".
        </div>
      </div>
    `;

    // Send email with file attached
    await sendMail({
      to: "tailoringturba@gmail.com",
      subject: `[CAREER APPLICATION] ${name} — ${position}`,
      html: hrHtml,
      attachments: [
        {
          filename: resumeFile.name,
          content: fileBuffer,
          contentType: resumeFile.type
        }
      ]
    });

    return NextResponse.json({ success: true, message: "Application submitted successfully." });
  } catch (error: any) {
    console.error("Careers API Error:", error);
    return NextResponse.json({ error: error.message || "Failed to process application." }, { status: 500 });
  }
}
