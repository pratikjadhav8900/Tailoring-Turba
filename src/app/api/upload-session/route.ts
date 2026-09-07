export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";

// ---------------------------------------------------------------------------
// In-memory session store — survives Next.js HMR via globalThis
// Each entry: { url: string | null, createdAt: number }
// ---------------------------------------------------------------------------

interface SessionEntry {
  url: string | null;
  createdAt: number;
}

const GLOBAL_KEY = "__uploadSessionStore__";
const TTL_MS = 30 * 60 * 1000; // 30 minutes
const MAX_ACTIVE_SESSIONS = 500;
const SESSION_ID_REGEX = /^[a-zA-Z0-9_-]{8,64}$/;

function getStore(): Map<string, SessionEntry> {
  if (!(globalThis as any)[GLOBAL_KEY]) {
    (globalThis as any)[GLOBAL_KEY] = new Map<string, SessionEntry>();
  }
  return (globalThis as any)[GLOBAL_KEY] as Map<string, SessionEntry>;
}

function cleanup(store: Map<string, SessionEntry>) {
  const now = Date.now();
  Array.from(store.entries()).forEach(([id, entry]) => {
    if (now - entry.createdAt > TTL_MS) {
      store.delete(id);
    }
  });

  // If still above maximum capacity, evict oldest 20% of sessions
  if (store.size > MAX_ACTIVE_SESSIONS) {
    const sorted = Array.from(store.entries()).sort((a, b) => a[1].createdAt - b[1].createdAt);
    const evictCount = Math.ceil(store.size * 0.2);
    for (let i = 0; i < evictCount; i++) {
      store.delete(sorted[i][0]);
    }
  }
}

// ---------------------------------------------------------------------------
// GET /api/upload-session?session=<id>
// ---------------------------------------------------------------------------
export async function GET(request: NextRequest) {
  const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";

  // Rate limit: max 60 requests per minute per IP
  const rateLimit = checkRateLimit(`upload_session_get_${clientIp}`, 60, 60 * 1000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many upload session requests. Please wait." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
    );
  }

  const sessionId = request.nextUrl.searchParams.get("session");
  if (!sessionId || !SESSION_ID_REGEX.test(sessionId)) {
    return NextResponse.json({ error: "Invalid or missing session ID." }, { status: 400 });
  }

  const store = getStore();
  cleanup(store);

  if (!store.has(sessionId)) {
    if (store.size >= MAX_ACTIVE_SESSIONS) {
      return NextResponse.json({ error: "Upload session pool at capacity. Please try again shortly." }, { status: 503 });
    }
    store.set(sessionId, { url: null, createdAt: Date.now() });
  }

  const entry = store.get(sessionId)!;
  return NextResponse.json({ url: entry.url });
}

// ---------------------------------------------------------------------------
// POST /api/upload-session
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";

  // Rate limit: max 20 posts per minute per IP
  const rateLimit = checkRateLimit(`upload_session_post_${clientIp}`, 20, 60 * 1000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many uploads submitted. Please wait." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
    );
  }

  let body: { session?: string; url?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { session: sessionId, url } = body;
  if (!sessionId || !url || !SESSION_ID_REGEX.test(sessionId)) {
    return NextResponse.json({ error: "Invalid session ID or missing upload URL." }, { status: 400 });
  }

  if (typeof url !== "string" || url.length > 1024) {
    return NextResponse.json({ error: "Invalid URL format or length." }, { status: 400 });
  }

  // Must be valid HTTP(S) URL
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return NextResponse.json({ error: "Invalid URL scheme." }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Malformed URL." }, { status: 400 });
  }

  const store = getStore();
  cleanup(store);

  const existing = store.get(sessionId);
  if (!existing && store.size >= MAX_ACTIVE_SESSIONS) {
    return NextResponse.json({ error: "Upload session pool at capacity." }, { status: 503 });
  }

  store.set(sessionId, {
    url,
    createdAt: existing?.createdAt ?? Date.now(),
  });

  return NextResponse.json({ ok: true });
}
