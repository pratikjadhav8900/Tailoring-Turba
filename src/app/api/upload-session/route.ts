export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

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
}

// ---------------------------------------------------------------------------
// GET /api/upload-session?session=<id>
// If session doesn't exist, initialise it.  Returns { url } (null until mobile posts).
// ---------------------------------------------------------------------------
export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("session");
  if (!sessionId) {
    return NextResponse.json({ error: "Missing session parameter" }, { status: 400 });
  }

  const store = getStore();
  cleanup(store);

  if (!store.has(sessionId)) {
    store.set(sessionId, { url: null, createdAt: Date.now() });
  }

  const entry = store.get(sessionId)!;
  return NextResponse.json({ url: entry.url });
}

// ---------------------------------------------------------------------------
// POST /api/upload-session
// Body: { session: string; url: string }
// Called by the mobile page once Cloudinary upload is done.
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  let body: { session?: string; url?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { session: sessionId, url } = body;
  if (!sessionId || !url) {
    return NextResponse.json({ error: "Missing session or url" }, { status: 400 });
  }

  const store = getStore();
  cleanup(store);

  // Upsert — the session may not exist yet if the mobile link was opened directly
  const existing = store.get(sessionId);
  store.set(sessionId, {
    url,
    createdAt: existing?.createdAt ?? Date.now(),
  });

  return NextResponse.json({ ok: true });
}
