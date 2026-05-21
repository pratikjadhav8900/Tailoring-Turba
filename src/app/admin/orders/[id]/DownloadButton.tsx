"use client";
import React, { useState } from "react";
import { Download, Loader2 } from "lucide-react";

interface DownloadButtonProps {
  url: string;
  filename: string;
  className?: string;
  children?: React.ReactNode;
}

export default function DownloadButton({ url, filename, className, children }: DownloadButtonProps) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDownloading(true);
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Network response was not ok");
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Failed to download file directly:", error);
      // Fallback: open in new tab
      window.open(url, "_blank", "noopener,noreferrer");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={downloading}
      className={className}
      style={{ cursor: 'pointer' }}
    >
      {children}
      {downloading ? (
        <Loader2 className="animate-spin" size={16} />
      ) : (
        <Download size={16} />
      )}
    </button>
  );
}
