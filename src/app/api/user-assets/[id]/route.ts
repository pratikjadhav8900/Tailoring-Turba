export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import fs from "fs/promises";
import path from "path";

/**
 * GET /api/user-assets/[id]
 *
 * Secure Asset Delivery:
 * 1. Checks authentication.
 * 2. Resolves UserAsset or OrderItem printFile ownership.
 * 3. Enforces customer isolation: Customer A cannot access Customer B's artwork.
 * 4. Allows ADMIN and SUPER_ADMIN access for legitimate order fulfillment.
 * 5. Serves local fallback files securely without exposing web root directory traversal.
 * 6. For remote Cloudinary assets, generates a short-lived signed URL or proxy redirect.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const assetId = params.id;
    if (!assetId) {
      return NextResponse.json({ error: "Missing asset ID" }, { status: 400 });
    }

    const role = (session.user as { role?: string })?.role;
    const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";

    // 1. Try resolving as a UserAsset record
    let asset = await prisma.userAsset.findUnique({
      where: { id: assetId },
      include: { user: { select: { id: true, email: true } } },
    });

    let targetUrl: string | null = null;
    let isAuthorized = false;

    if (asset) {
      targetUrl = asset.url;
      // Customer can access their own asset, or Admin can access for fulfillment
      isAuthorized = asset.userId === session.user.id || isAdmin;
    } else {
      // 2. Try resolving via OrderItem printFiles or mockupUrl
      const orderItem = await prisma.orderItem.findFirst({
        where: {
          OR: [
            { id: assetId },
            { printFiles: { has: assetId } },
          ],
        },
        include: {
          order: {
            select: { userId: true },
          },
        },
      });

      if (orderItem) {
        isAuthorized = orderItem.order.userId === session.user.id || isAdmin;
        targetUrl = orderItem.printFiles.includes(assetId)
          ? assetId
          : orderItem.mockupUrl || orderItem.printFiles[0] || null;
      }
    }

    // 3. Fallback: Lookup by sanitized filename if assetId is a local asset filename (e.g., asset-123.png)
    if (!targetUrl && assetId.startsWith("asset-")) {
      // Find if this filename belongs to any of current user's assets or orders
      const userAsset = await prisma.userAsset.findFirst({
        where: {
          url: { contains: assetId },
          ...(isAdmin ? {} : { userId: session.user.id }),
        },
      });

      if (userAsset) {
        isAuthorized = true;
        targetUrl = userAsset.url;
      } else {
        // Check order items
        const matchingOrderItem = await prisma.orderItem.findFirst({
          where: {
            OR: [
              { printFiles: { has: `/uploads/${assetId}` } },
              { mockupUrl: `/uploads/${assetId}` },
              { mockupUrlBack: `/uploads/${assetId}` },
            ],
            ...(isAdmin ? {} : { order: { userId: session.user.id } }),
          },
        });

        if (matchingOrderItem) {
          isAuthorized = true;
          targetUrl = `/uploads/${assetId}`;
        }
      }
    }

    if (!targetUrl || !isAuthorized) {
      // Fail closed with generic 404/403 to prevent asset enumeration
      return NextResponse.json({ error: "Asset not found or access denied." }, { status: 404 });
    }

    // 4. If targetUrl is local filesystem fallback: stream the file securely
    if (targetUrl.startsWith("/uploads/")) {
      const filename = path.basename(targetUrl);
      // Path traversal prevention: ensure filename is strictly a valid basename
      if (!/^[a-zA-Z0-9_\-\.]+$/.test(filename)) {
        return NextResponse.json({ error: "Invalid asset identifier" }, { status: 400 });
      }

      // Check both private-uploads directory and public/uploads
      const privateUploadPath = path.join(process.cwd(), "private-uploads", filename);
      const publicUploadPath = path.join(process.cwd(), "public", "uploads", filename);

      let finalFilePath: string | null = null;
      try {
        await fs.access(privateUploadPath);
        finalFilePath = privateUploadPath;
      } catch {
        try {
          await fs.access(publicUploadPath);
          finalFilePath = publicUploadPath;
        } catch {
          finalFilePath = null;
        }
      }

      if (!finalFilePath) {
        return NextResponse.json({ error: "File not found" }, { status: 404 });
      }

      const fileBuffer = await fs.readFile(finalFilePath);
      const ext = path.extname(filename).toLowerCase();
      let contentType = "application/octet-stream";
      if (ext === ".png") contentType = "image/png";
      else if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
      else if (ext === ".webp") contentType = "image/webp";
      else if (ext === ".svg") contentType = "image/svg+xml";
      else if (ext === ".pdf") contentType = "application/pdf";

      return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Content-Disposition": `inline; filename="${filename}"`,
          "Cache-Control": "private, no-cache, no-store, must-revalidate",
        },
      });
    }

    // 5. If Cloudinary remote URL:
    // Generate authenticated signed URL or redirect if authorized
    return NextResponse.redirect(targetUrl, { status: 302 });

  } catch (error: any) {
    console.error("[USER_ASSET_ACCESS_ERROR]", error);
    return NextResponse.json({ error: "Failed to retrieve asset" }, { status: 500 });
  }
}
