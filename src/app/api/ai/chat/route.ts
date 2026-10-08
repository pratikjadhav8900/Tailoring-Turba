import { NextRequest, NextResponse } from "next/server";
import { processConsultantChat } from "@/lib/turba-ai/service";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, context, conversationId } = body;

    if (!Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Invalid request: messages array is required." },
        { status: 400 }
      );
    }

    // Limit conversation history sent to the server for cost control and token hygiene
    const safeMessages = messages.slice(-10);
    const safeContext = context || {};

    const result = await processConsultantChat({
      messages: safeMessages,
      context: safeContext,
      conversationId: conversationId || `conv-${Date.now()}`,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[API /api/ai/chat] Error:", error);
    return NextResponse.json(
      {
        error: "Looks like I'm having a little trouble connecting right now. Please try again in a moment.",
        fallback: true,
      },
      { status: 500 }
    );
  }
}
