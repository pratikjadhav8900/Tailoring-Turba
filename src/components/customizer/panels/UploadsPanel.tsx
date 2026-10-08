"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { UploadCloud, Smartphone, LogIn, X, AlertTriangle } from "lucide-react";
import { useSession, signIn } from "next-auth/react";
import styles from "../PoloCustomizer.module.css";

type UserAsset = {
  id: string;
  url: string;
  createdAt: string;
};

interface UploadsPanelProps {
  isUploading: boolean;
  onUploadClick: () => void;
  onAddLogoUrl?: (url: string) => void;
}

export default function UploadsPanel({
  isUploading,
  onUploadClick,
  onAddLogoUrl,
}: UploadsPanelProps) {
  const { data: session } = useSession();
  const [userAssets, setUserAssets] = useState<UserAsset[]>([]);
  const [isLoadingAssets, setIsLoadingAssets] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrSessionId, setQrSessionId] = useState<string | null>(null);
  const [qrStatus, setQrStatus] = useState<"waiting" | "received">("waiting");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!session?.user?.id) return;
    if (!isUploading) {
      setIsLoadingAssets(true);
      fetch("/api/user-assets")
        .then((res) => res.json())
        .then((data) => {
          if (data.assets) setUserAssets(data.assets);
        })
        .finally(() => setIsLoadingAssets(false));
    }
  }, [session, isUploading]);

  const openQrModal = useCallback(() => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setQrSessionId(id);
    setQrStatus("waiting");
    setShowQrModal(true);
    fetch(`/api/upload-session?session=${id}`).catch(() => {});
  }, []);

  const closeQrModal = useCallback(() => {
    setShowQrModal(false);
    setQrSessionId(null);
    setQrStatus("waiting");
    if (pollRef.current) clearInterval(pollRef.current);
  }, []);

  useEffect(() => {
    if (!showQrModal || !qrSessionId) return;
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/upload-session?session=${qrSessionId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.url) {
          setQrStatus("received");
          if (pollRef.current) clearInterval(pollRef.current);
          onAddLogoUrl?.(data.url);
          setTimeout(closeQrModal, 2000);
        }
      } catch {}
    }, 2000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [showQrModal, qrSessionId, onAddLogoUrl, closeQrModal]);

  return (
    <>
      <div className={styles.contextBody}>
        {/* Upload Buttons */}
        <button
          className={styles.addAssetBtn}
          onClick={onUploadClick}
          disabled={isUploading}
        >
          <UploadCloud size={16} />
          {isUploading ? "Uploading..." : "Upload from this device"}
        </button>
        <button
          className={`${styles.addAssetBtnOutline} ${styles.desktopOnly}`}
          onClick={openQrModal}
        >
          <Smartphone size={16} />
          Upload from phone
        </button>

        {/* DPI Quality Notice */}
        <div className={styles.dpiNotice}>
          <AlertTriangle size={14} />
          <span>
            For best print quality, upload images at least <strong>300 DPI</strong> (2400x3000px for a 8x10" print).
          </span>
        </div>

        {/* User Uploads Gallery */}
        {session ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <span className={styles.editSectionLabel}>Your Uploads</span>
            {isLoadingAssets ? (
              <div className={styles.emptyState}>Loading...</div>
            ) : userAssets.length > 0 ? (
              <div className={styles.uploadsGrid}>
                {userAssets.map((asset) => (
                  <button
                    key={asset.id}
                    onClick={() => onAddLogoUrl?.(asset.url)}
                    className={styles.uploadThumbnail}
                    title="Add to design"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={asset.url}
                      alt="upload"
                      style={{ width: "100%", height: "100%", objectFit: "contain" }}
                    />
                  </button>
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                No previous uploads found.
              </div>
            )}
          </div>
        ) : (
          <div className={styles.uploadSignInWrap}>
            <p className={styles.ctxHint}>
              Sign in to access previous uploads.
            </p>
            <button className={styles.signInBtn} onClick={() => signIn()}>
              <LogIn size={14} /> Sign in
            </button>
          </div>
        )}
      </div>

      {/* QR Code Modal */}
      {showQrModal && qrSessionId && (
        <div className={styles.qrModalOverlay} onClick={closeQrModal}>
          <div className={styles.qrModalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.qrModalHeader}>
              <div>
                <div className={styles.qrModalTitle}>
                  {qrStatus === "received" ? "Photo received!" : "Upload from phone"}
                </div>
                <div className={styles.qrModalSubtitle}>
                  {qrStatus === "received"
                    ? "Your image has been added to the canvas."
                    : "Scan with your phone camera to upload"}
                </div>
              </div>
              <button className={styles.qrModalClose} onClick={closeQrModal}>
                <X size={16} />
              </button>
            </div>

            {qrStatus === "waiting" ? (
              <>
                <div className={styles.qrImageWrap}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&format=svg&data=${encodeURIComponent(
                      `${typeof window !== "undefined" ? window.location.origin : ""}/customizer/upload-phone?session=${qrSessionId}`
                    )}`}
                    alt="QR Code"
                    width={220}
                    height={220}
                    style={{ borderRadius: "8px", display: "block" }}
                  />
                </div>
                <div className={styles.qrWaitingIndicator}>
                  <div className={styles.qrPulseDot} />
                  <span>Waiting for your phone upload...</span>
                </div>
              </>
            ) : (
              <div className={styles.qrSuccessCard}>
                <div className={styles.qrSuccessIcon}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#15803d" }}>Image added to canvas!</div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
