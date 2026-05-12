"use client";
import React, { useState, useEffect } from "react";
import { Loader2, X, RotateCcw } from "lucide-react";
import html2canvas from "html2canvas";
import dynamic from "next/dynamic";

const ThreeDScene = dynamic(() => import("./ThreeDScene"), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <Loader2 className="w-12 h-12 text-white animate-spin opacity-20" />
    </div>
  )
});

interface ThreeDPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  bodyColor: string;
  mockupId: string;
  garmentType: string;
}

export default function ThreeDPreview({ isOpen, onClose, bodyColor, mockupId, garmentType }: ThreeDPreviewProps) {
  const [textureUrl, setTextureUrl] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [hasWebGL, setHasWebGL] = useState<boolean | null>(null);

  useEffect(() => {
    if (isOpen) {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      setHasWebGL(!!gl);
      captureMockup();
    }
  }, [isOpen]);

  const captureMockup = async () => {
    const element = document.getElementById(mockupId);
    if (!element) return;
    setIsCapturing(true);
    try {
      const canvas = await html2canvas(element, { backgroundColor: null, useCORS: true, scale: 2 });
      setTextureUrl(canvas.toDataURL("image/png"));
    } catch (err) {
      console.error("Capture failed:", err);
    } finally {
      setIsCapturing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 md:p-8">
      <div className="relative w-full h-full max-w-6xl max-h-[800px] bg-[#0a0a0a] rounded-3xl overflow-hidden border border-white/5 shadow-[0_0_100px_rgba(0,0,0,0.5)]">
        
        <div className="absolute top-8 left-8 right-8 z-10 flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-bold text-white font-serif mb-2 tracking-tight">Real-Time 3D Showcase</h2>
            <p className="text-white/40 text-sm font-medium">Your custom design, mapped onto a high-fidelity 3D model.</p>
          </div>
          <div className="flex gap-4">
            {hasWebGL && (
              <button onClick={captureMockup} className="px-5 py-2.5 rounded-full bg-white/5 hover:bg-white/10 text-white/80 text-sm font-bold flex items-center gap-2 border border-white/10 transition-all">
                <RotateCcw size={16} /> Sync Design
              </button>
            )}
            <button onClick={onClose} className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all border border-white/20">
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="w-full h-full">
          {hasWebGL === false ? (
            <div className="w-full h-full flex flex-col items-center justify-center p-12 text-center">
              <div className="w-24 h-24 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
                <X className="text-red-500" size={48} />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">3D Acceleration Unavailable</h3>
              <p className="text-white/60 max-w-md mb-8">Your browser's 3D engine is currently overloaded. Please restart your browser.</p>
              {textureUrl && (
                <div className="relative w-64 h-64 rounded-xl overflow-hidden border border-white/10">
                  <img src={textureUrl} alt="2D Preview" className="w-full h-full object-contain" />
                </div>
              )}
            </div>
          ) : hasWebGL === true ? (
            <ThreeDScene bodyColor={bodyColor} textureUrl={textureUrl} garmentType={garmentType} />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Loader2 className="w-12 h-12 text-white animate-spin opacity-20" />
            </div>
          )}
        </div>

        {/* Footer Hint */}
        <div className="absolute bottom-8 left-8 right-8 z-10 flex justify-center">
          <div className="px-6 py-3 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-full flex gap-6 text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
            <span>Left Click: Rotate</span>
            <div className="w-px h-3 bg-white/10" />
            <span>Scroll: Zoom</span>
            <div className="w-px h-3 bg-white/10" />
            <span>Right Click: Pan</span>
          </div>
        </div>

        {/* Syncing Overlay */}
        {isCapturing && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-all">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-12 h-12 text-white animate-spin" />
              <p className="text-white font-bold tracking-widest uppercase text-xs">Capturing Design Texture...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
