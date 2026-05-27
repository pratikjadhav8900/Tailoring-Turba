"use client";
import { useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

type UploadState = "idle" | "uploading" | "success" | "error";

function UploadPhoneContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");

  // Animate in on mount
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !sessionId) return;

    // Show local preview immediately
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);
    setUploadState("uploading");
    setErrorMsg("");

    try {
      // Step 1 — Upload to Cloudinary via existing endpoint
      const formData = new FormData();
      formData.append("file", file);
      formData.append("isLogo", "true");
      const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });

      if (!uploadRes.ok) {
        throw new Error("Upload failed – please try again.");
      }
      const { url } = await uploadRes.json();

      // Step 2 — Pair with desktop session
      const pairRes = await fetch("/api/upload-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session: sessionId, url }),
      });

      if (!pairRes.ok) {
        throw new Error("Could not link to desktop session.");
      }

      setPreviewUrl(url);
      setUploadState("success");
    } catch (err: any) {
      setErrorMsg(err?.message || "Something went wrong.");
      setUploadState("error");
    } finally {
      e.target.value = "";
    }
  };

  const reset = () => {
    setUploadState("idle");
    setPreviewUrl(null);
    setErrorMsg("");
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          font-family: 'Inter', sans-serif;
          background: #0f1924;
          min-height: 100dvh;
          overflow: hidden;
        }

        .page {
          min-height: 100dvh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 24px 20px;
          background: radial-gradient(ellipse at 60% 0%, #0d3a3a 0%, #0f1924 55%);
          opacity: 0;
          transform: translateY(16px);
          transition: opacity 0.5s ease, transform 0.5s ease;
          gap: 0;
        }
        .page.mounted {
          opacity: 1;
          transform: translateY(0);
        }

        /* ── Logo / Wordmark ─────────────────────── */
        .brand {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          margin-bottom: 28px;
        }
        .brandLogo {
          width: 44px;
          height: 44px;
          background: linear-gradient(135deg, #1abc9c 0%, #0d8c72 100%);
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 18px rgba(26, 188, 156, 0.35);
        }
        .brandLogo svg { color: #fff; }
        .brandName {
          font-size: 1rem;
          font-weight: 800;
          letter-spacing: -0.01em;
          color: #e8f0ee;
        }
        .brandSub {
          font-size: 0.7rem;
          font-weight: 500;
          color: #5e8c82;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        /* ── Card ────────────────────────────────── */
        .card {
          width: 100%;
          max-width: 390px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.09);
          border-radius: 24px;
          padding: 28px 24px 32px;
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          box-shadow:
            0 0 0 1px rgba(26, 188, 156, 0.08),
            0 32px 64px rgba(0, 0, 0, 0.45);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 24px;
        }

        /* ── Heading ─────────────────────────────── */
        .heading { text-align: center; }
        .heading h1 {
          font-size: 1.35rem;
          font-weight: 800;
          color: #e8f0ee;
          letter-spacing: -0.02em;
          margin-bottom: 6px;
        }
        .heading p {
          font-size: 0.82rem;
          color: #6b9b90;
          line-height: 1.55;
        }

        /* ── Drop Zone / Touch Target ─────────────── */
        .dropZone {
          width: 100%;
          cursor: pointer;
          border: 2px dashed rgba(26, 188, 156, 0.35);
          border-radius: 18px;
          padding: 36px 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 14px;
          background: rgba(26, 188, 156, 0.04);
          transition: border-color 0.2s, background 0.2s, transform 0.15s;
          -webkit-tap-highlight-color: transparent;
          user-select: none;
          touch-action: manipulation;
        }
        .dropZone:active { transform: scale(0.97); border-color: #1abc9c; background: rgba(26, 188, 156, 0.1); }

        .dropIcon {
          width: 64px;
          height: 64px;
          background: linear-gradient(135deg, rgba(26,188,156,0.18) 0%, rgba(13,140,114,0.12) 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1.5px solid rgba(26, 188, 156, 0.25);
        }

        .dropTitle {
          font-size: 1rem;
          font-weight: 700;
          color: #e0eeea;
          text-align: center;
        }
        .dropSub {
          font-size: 0.75rem;
          color: #5e8c82;
          text-align: center;
          line-height: 1.4;
        }

        /* ── Uploading State ─────────────────────── */
        .uploadingCard {
          width: 100%;
          border: 1.5px solid rgba(26, 188, 156, 0.2);
          border-radius: 18px;
          padding: 32px 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          background: rgba(26, 188, 156, 0.04);
        }
        .uploadingLabel {
          font-size: 0.92rem;
          font-weight: 600;
          color: #1abc9c;
        }
        .uploadingSub {
          font-size: 0.75rem;
          color: #5e8c82;
          text-align: center;
        }

        /* Spinner */
        @keyframes spin { to { transform: rotate(360deg); } }
        .spinner {
          width: 44px;
          height: 44px;
          border: 3px solid rgba(26, 188, 156, 0.15);
          border-top-color: #1abc9c;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        /* Progress bar */
        @keyframes indeterminate {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
        .progressBar {
          width: 100%;
          height: 4px;
          background: rgba(26, 188, 156, 0.12);
          border-radius: 4px;
          overflow: hidden;
        }
        .progressFill {
          height: 100%;
          width: 40%;
          background: linear-gradient(90deg, #1abc9c, #0d8c72);
          border-radius: 4px;
          animation: indeterminate 1.2s ease-in-out infinite;
        }

        /* ── Success State ───────────────────────── */
        @keyframes pop { 0% { transform: scale(0.6); opacity: 0; } 80% { transform: scale(1.08); } 100% { transform: scale(1); opacity: 1; } }

        .successCard {
          width: 100%;
          border: 1.5px solid rgba(26, 188, 156, 0.3);
          border-radius: 18px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          align-items: center;
          background: rgba(26, 188, 156, 0.05);
        }
        .successPreview {
          width: 100%;
          max-height: 220px;
          object-fit: cover;
          display: block;
        }
        .successBody {
          padding: 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          width: 100%;
        }
        .checkCircle {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #1abc9c, #0d8c72);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 16px rgba(26, 188, 156, 0.4);
          animation: pop 0.4s ease forwards;
        }
        .successTitle {
          font-size: 1rem;
          font-weight: 800;
          color: #e8f0ee;
          text-align: center;
        }
        .successSub {
          font-size: 0.75rem;
          color: #6b9b90;
          text-align: center;
          line-height: 1.5;
        }
        .successBtn {
          margin-top: 6px;
          width: 100%;
          padding: 12px 20px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px;
          color: #9cb8b3;
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s;
          font-family: inherit;
        }
        .successBtn:hover { background: rgba(255,255,255,0.1); }

        /* ── Error State ─────────────────────────── */
        .errorCard {
          width: 100%;
          border: 1.5px solid rgba(239, 68, 68, 0.3);
          border-radius: 18px;
          padding: 28px 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          background: rgba(239, 68, 68, 0.04);
        }
        .errorIcon {
          width: 48px;
          height: 48px;
          background: rgba(239, 68, 68, 0.15);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.6rem;
        }
        .errorTitle {
          font-size: 0.95rem;
          font-weight: 700;
          color: #f87171;
          text-align: center;
        }
        .errorMsg {
          font-size: 0.75rem;
          color: #9ca3af;
          text-align: center;
          line-height: 1.5;
        }
        .retryBtn {
          margin-top: 4px;
          width: 100%;
          padding: 13px 20px;
          background: linear-gradient(135deg, #1abc9c 0%, #0d8c72 100%);
          border: none;
          border-radius: 12px;
          color: white;
          font-size: 0.9rem;
          font-weight: 700;
          cursor: pointer;
          transition: opacity 0.15s, transform 0.1s;
          font-family: inherit;
          letter-spacing: -0.01em;
          box-shadow: 0 4px 18px rgba(26, 188, 156, 0.35);
        }
        .retryBtn:active { opacity: 0.9; transform: scale(0.98); }

        /* ── No Session Fallback ─────────────────── */
        .noSession {
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }
        .noSessionIcon { font-size: 3rem; }
        .noSessionTitle { font-size: 1.05rem; font-weight: 700; color: #e8f0ee; }
        .noSessionText { font-size: 0.8rem; color: #5e8c82; line-height: 1.6; }

        /* ── Footer ──────────────────────────────── */
        .footer {
          margin-top: 20px;
          font-size: 0.68rem;
          color: #334a45;
          text-align: center;
          letter-spacing: 0.03em;
        }
      `}</style>

      <div className={`page${mounted ? " mounted" : ""}`}>
        {/* Brand */}
        <div className="brand">
          <div className="brandLogo">
            {/* Shirt icon */}
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none"
              stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.57a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.57a2 2 0 0 0-1.34-2.23z"/>
            </svg>
          </div>
          <span className="brandName">Tailoring Turba</span>
          <span className="brandSub">Mobile Upload</span>
        </div>

        <div className="card">
          {!sessionId ? (
            /* ── No session ── */
            <div className="noSession">
              <div className="noSessionIcon">🔗</div>
              <div className="noSessionTitle">No session found</div>
              <div className="noSessionText">
                Please scan the QR code from the customizer on your desktop to get started.
              </div>
            </div>
          ) : uploadState === "idle" ? (
            /* ── Idle ── */
            <>
              <div className="heading">
                <h1>Upload a Photo</h1>
                <p>Tap below to open your camera or photo library. Your image will appear on your desktop instantly.</p>
              </div>

              <div
                className="dropZone"
                onClick={() => fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                aria-label="Select image from camera or library"
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click(); }}
              >
                <div className="dropIcon">
                  {/* Camera icon */}
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24"
                    fill="none" stroke="#1abc9c" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                  </svg>
                </div>
                <div className="dropTitle">Tap to select photo</div>
                <div className="dropSub">Camera • Photo Library • Files<br/>PNG, JPG, SVG, WEBP supported</div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                style={{ display: "none" }}
                onChange={handleFileSelect}
              />
            </>
          ) : uploadState === "uploading" ? (
            /* ── Uploading ── */
            <div className="uploadingCard">
              <div className="spinner" />
              <div className="uploadingLabel">Uploading your photo…</div>
              <div className="progressBar"><div className="progressFill" /></div>
              <div className="uploadingSub">Sending to desktop workspace</div>
              {previewUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewUrl}
                  alt="Preview"
                  style={{ width: "100%", maxHeight: "140px", objectFit: "cover", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)" }}
                />
              )}
            </div>
          ) : uploadState === "success" ? (
            /* ── Success ── */
            <div className="successCard">
              {previewUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="successPreview" src={previewUrl} alt="Uploaded" />
              )}
              <div className="successBody">
                <div className="checkCircle">
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"
                    fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <div className="successTitle">Photo sent! 🎉</div>
                <div className="successSub">
                  Your image has appeared on your desktop customizer.<br/>You can close this tab or upload another photo.
                </div>
                <button className="successBtn" onClick={reset}>Upload another photo</button>
              </div>
            </div>
          ) : (
            /* ── Error ── */
            <div className="errorCard">
              <div className="errorIcon">⚠️</div>
              <div className="errorTitle">Upload failed</div>
              <div className="errorMsg">{errorMsg}</div>
              <button className="retryBtn" onClick={reset}>Try Again</button>
            </div>
          )}
        </div>

        <div className="footer">Tailoring Turba · Secure mobile upload</div>
      </div>
    </>
  );
}

export default function UploadPhonePage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0f1924", color: "#5e8c82", fontFamily: "sans-serif" }}>
        Loading...
      </div>
    }>
      <UploadPhoneContent />
    </Suspense>
  );
}
