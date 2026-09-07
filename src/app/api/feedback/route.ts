export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { prisma, withRetry } from "@/lib/prisma";
import { sanitize } from "@/lib/sanitize";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    let {
      orderId,
      serviceOverall,
      serviceProfessionalism,
      serviceTimeline,
      easeOrdering,
      easeCommunication,
      easeProcess,
      fabricQuality,
      fabricExpectations,
      fabricStitching,
      printingLogo,
      printingAccuracy,
      comment
    } = await req.json();

    // Check basic parameters
    if (
      !orderId ||
      serviceOverall === undefined ||
      serviceProfessionalism === undefined ||
      serviceTimeline === undefined ||
      easeOrdering === undefined ||
      easeCommunication === undefined ||
      easeProcess === undefined ||
      fabricQuality === undefined ||
      fabricExpectations === undefined ||
      fabricStitching === undefined ||
      printingLogo === undefined ||
      printingAccuracy === undefined
    ) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    // Convert rating inputs to integers
    const rServiceOverall = parseInt(serviceOverall, 10);
    const rServiceProfessionalism = parseInt(serviceProfessionalism, 10);
    const rServiceTimeline = parseInt(serviceTimeline, 10);
    const rEaseOrdering = parseInt(easeOrdering, 10);
    const rEaseCommunication = parseInt(easeCommunication, 10);
    const rEaseProcess = parseInt(easeProcess, 10);
    const rFabricQuality = parseInt(fabricQuality, 10);
    const rFabricExpectations = parseInt(fabricExpectations, 10);
    const rFabricStitching = parseInt(fabricStitching, 10);
    const rPrintingLogo = parseInt(printingLogo, 10);
    const rPrintingAccuracy = parseInt(printingAccuracy, 10);

    // Validate rating bounds (1 to 5)
    const isValidRating = (r: number) => !isNaN(r) && r >= 1 && r <= 5;
    if (
      !isValidRating(rServiceOverall) ||
      !isValidRating(rServiceProfessionalism) ||
      !isValidRating(rServiceTimeline) ||
      !isValidRating(rEaseOrdering) ||
      !isValidRating(rEaseCommunication) ||
      !isValidRating(rEaseProcess) ||
      !isValidRating(rFabricQuality) ||
      !isValidRating(rFabricExpectations) ||
      !isValidRating(rFabricStitching) ||
      !isValidRating(rPrintingLogo) ||
      !isValidRating(rPrintingAccuracy)
    ) {
      return NextResponse.json({ error: "Ratings must be integers between 1 and 5." }, { status: 400 });
    }

    // Sanitize comment
    if (comment) {
      comment = sanitize(comment);
    } else {
      comment = null;
    }

    // 1. Authenticate request using session
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    // 2. Fetch order to verify eligibility and ownership
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { feedback: true }
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    // 3. Strict Server-Side Ownership Check (Prevent IDOR)
    const userRole = (session.user as { role?: string })?.role;
    const isAdmin = userRole === "ADMIN" || userRole === "SUPER_ADMIN";
    const isOwner = order.userId === session.user.id;

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    if (order.status !== "DELIVERED") {
      return NextResponse.json({ error: "Feedback can only be submitted for delivered orders." }, { status: 400 });
    }

    if (order.feedback) {
      return NextResponse.json({ error: "Feedback has already been submitted for this order." }, { status: 400 });
    }

    // Save feedback to database
    await withRetry(async () => {
      await prisma.orderFeedback.create({
        data: {
          orderId,
          serviceOverall: rServiceOverall,
          serviceProfessionalism: rServiceProfessionalism,
          serviceTimeline: rServiceTimeline,
          easeOrdering: rEaseOrdering,
          easeCommunication: rEaseCommunication,
          easeProcess: rEaseProcess,
          fabricQuality: rFabricQuality,
          fabricExpectations: rFabricExpectations,
          fabricStitching: rFabricStitching,
          printingLogo: rPrintingLogo,
          printingAccuracy: rPrintingAccuracy,
          comment: comment
        }
      });
    });

    return NextResponse.json({ success: true, message: "Feedback submitted successfully." });
  } catch (error: any) {
    console.error("[FEEDBACK_API_ERROR] Failed to save feedback:", error);
    return NextResponse.json({ error: error.message || "Failed to process feedback." }, { status: 500 });
  }
}
