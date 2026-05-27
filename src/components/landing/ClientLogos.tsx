"use client";
import React, { useRef, useEffect, useState } from "react";
import styles from "./ClientLogos.module.css";

// High-fidelity vector logos mapping for the brand marquee
const BRAND_LOGOS: Record<string, React.ReactNode> = {
  Google: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.24 10.285V14.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.578-7.859-8s3.53-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l3.227-3.134C18.155 2.185 15.46 1 12.24 1 5.92 1 1 5.92 1 12s4.92 11 11.24 11c6.6 0 11-4.65 11-11.2 0-.75-.08-1.32-.18-1.815H12.24z"/>
    </svg>
  ),
  SBI: (
    <svg viewBox="0 0 500 500" fill="currentColor">
      <path d="m234,499a249,249 0 1,1 32,0V295a45,45 0 1,0-32,0"/>
    </svg>
  ),
  AWS: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M6.763 10.036c0 .296.032.535.088.71.064.176.144.368.256.576.04.063.056.127.056.183 0 .08-.048.16-.152.24l-.503.335a.383.383 0 0 1-.208.072c-.08 0-.16-.04-.239-.112a2.47 2.47 0 0 1-.287-.375 6.18 6.18 0 0 1-.248-.471c-.622.734-1.405 1.101-2.347 1.101-.67 0-1.205-.191-1.596-.574-.391-.384-.59-.894-.59-1.533 0-.678.239-1.23.726-1.644.487-.415 1.133-.623 1.955-.623.272 0 .551.024.846.064.296.04.6.104.918.176v-.583c0-.607-.127-1.03-.375-1.277-.255-.248-.686-.367-1.3-.367-.28 0-.568.031-.863.103-.295.072-.583.16-.862.272a2.287 2.287 0 0 1-.28.104.488.488 0 0 1-.127.023c-.112 0-.168-.08-.168-.247v-.391c0-.128.016-.224.056-.28a.597.597 0 0 1 .224-.167c.279-.144.614-.264 1.005-.36a4.84 4.84 0 0 1 1.246-.151c.95 0 1.644.216 2.091.647.439.43.662 1.085.662 1.963v2.586zm-3.24 1.214c.263 0 .534-.048.822-.144.287-.096.543-.271.758-.51.128-.152.224-.32.272-.512.047-.191.08-.423.08-.694v-.335a6.66 6.66 0 0 0-.735-.136 6.02 6.02 0 0 0-.75-.048c-.535 0-.926.104-1.19.32-.263.215-.39.518-.39.917 0 .375.095.655.295.846.191.2.47.296.838.296zm6.41.862c-.144 0-.24-.024-.304-.08-.064-.048-.12-.16-.168-.311L7.586 5.55a1.398 1.398 0 0 1-.072-.32c0-.128.064-.2.191-.2h.783c.151 0 .255.025.31.08.065.048.113.16.16.312l1.342 5.284 1.245-5.284c.04-.16.088-.264.151-.312a.549.549 0 0 1 .32-.08h.638c.152 0 .256.025.32.08.063.048.12.16.151.312l1.261 5.348 1.381-5.348c.048-.16.104-.264.16-.312a.52.52 0 0 1 .311-.08h.743c.127 0 .2.065.2.2 0 .04-.009.08-.017.128a1.137 1.137 0 0 1-.056.2l-1.923 6.17c-.048.16-.104.263-.168.311a.51.51 0 0 1-.303.08h-.687c-.151 0-.255-.024-.32-.08-.063-.056-.119-.16-.15-.32l-1.238-5.148-1.23 5.14c-.04.16-.087.264-.15.32-.065.056-.177.08-.32.08zm10.256.215c-.415 0-.83-.048-1.229-.143-.399-.096-.71-.2-.918-.32-.128-.071-.215-.151-.247-.223a.563.563 0 0 1-.048-.224v-.407c0-.167.064-.247.183-.247.048 0 .096.008.144.024.048.016.12.048.2.08.271.12.566.215.878.279.319.064.63.096.95.096.502 0 .894-.088 1.165-.264a.86.86 0 0 0 .415-.758.777.777 0 0 0-.215-.559c-.144-.151-.416-.287-.807-.415l-1.157-.36c-.583-.183-1.014-.454-1.277-.813a1.902 1.902 0 0 1-.4-1.158c0-.335.073-.63.216-.886.144-.255.335-.479.575-.654.24-.184.51-.32.83-.415.32-.096.655-.136 1.006-.136.175 0 .359.008.535.032.183.024.35.056.518.088.16.04.312.08.455.127.144.048.256.096.336.144a.69.69 0 0 1 .24.2.43.43 0 0 1 .071.263v.375c0 .168-.064.256-.184.256a.83.83 0 0 1-.303-.096 3.652 3.652 0 0 0-1.532-.311c-.455 0-.815.071-1.062.223-.248.152-.375.383-.375.71 0 .224.08.416.24.567.159.152.454.304.877.44l1.134.358c.574.184.99.44 1.237.767.247.327.367.702.367 1.117 0 .343-.072.655-.207.926-.144.272-.336.511-.583.703-.248.2-.543.343-.886.447-.36.111-.734.167-1.142.167zM21.698 16.207c-2.626 1.94-6.442 2.969-9.722 2.969-4.598 0-8.74-1.7-11.87-4.526-.247-.223-.024-.527.272-.351 3.384 1.963 7.559 3.153 11.877 3.153 2.914 0 6.114-.607 9.06-1.852.439-.2.814.287.383.607zM22.792 14.961c-.336-.43-2.22-.207-3.074-.103-.255.032-.295-.192-.063-.36 1.5-1.053 3.967-.75 4.254-.399.287.36-.08 2.826-1.485 4.007-.215.184-.423.088-.327-.151.32-.79 1.03-2.57.695-2.994z"/>
    </svg>
  ),
  Škoda: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.3726 0 0 5.3726 0 12s5.3726 12 12 12 12-5.3726 12-12S18.6274 0 12 0Zm0 22.9636C5.945 22.9636 1.0364 18.055 1.0364 12 1.0364 5.945 5.945 1.0364 12 1.0364S22.9636 5.945 22.9636 12 18.055 22.9636 12 22.9636Zm5.189-7.2325-.269.7263h-.984c.263-.7089 3.5783-8.6177-2.9362-13.9819a9.5254 9.5254 0 0 0-4.0531.4483c.2172.175 2.474 2.0276 3.5373 4.315l-.312.084c-.5861-.6387-2.7156-2.9833-4.7448-3.7379a9.6184 9.6184 0 0 0-2.8448 2.3597c.953.4875 3.4432 1.9748 4.3896 3.1302-.0542.0244-.267.139-.267.139-1.736-1.3195-4.8199-2.0043-4.9775-2.0383a9.5126 9.5126 0 0 0-1.2267 3.6098c4.7759.9613 6.0618 3.1715 6.2818 5.6721H7.878l-1.5545-.6776a.8563.8563 0 0 0-.2524-.0531H3.1767a9.587 9.587 0 0 0 1.9267 2.9155h1.2334c.1063 0 .1993-.0133.2923-.0664l1.2489-.6378h9.042l.269.7264a4.8386 4.8386 0 0 0 2.9466-1.4667 4.839 4.839 0 0 0-2.9467-1.4666zm-4.14-.5786a1.1863 1.1863 0 0 1-.5038-1.2162 1.1862 1.1862 0 0 1 .931-.9309 1.1863 1.1863 0 0 1 1.2161.5038c.3098.4636.2563 1.0924-.1473 1.496-.4032.4032-1.0318.4574-1.496.1473z"/>
    </svg>
  ),
  IRCTC: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm-1 2.05c-.8.1-1.6.3-2.3.7l1.3 2.2V7c0 .6.4 1 1 1h.5a1.5 1.5 0 0 0 1.5-1.5V4.2a8.3 8.3 0 0 1-2 .85zm4.8 1.45a8 8 0 0 1 2 2.8l-1.3-.3A1.5 1.5 0 0 0 15 9.5v2h-2V9h-1V6.2h-.5c-.8 0-1.5.7-1.5 1.5v.7L7.5 7A8 8 0 0 1 13 4.1a8.3 8.3 0 0 1 2.8 1.4zm-9.3 5.4a8 8 0 0 1 .5-2.8l2.2 1.3v.6a1.5 1.5 0 0 0 1.5 1.5H12v2.5a1.5 1.5 0 0 0 .6 1.2l2.4 1.8a8 8 0 0 1-7.5-6.1zm9.3 5.4a8 8 0 0 1-2.8 1.4v-2.3l-1.4-1a1.5 1.5 0 0 0-1.8 0l-1.3 1a8 8 0 0 1 7.3.9z"/>
      <path d="M2.5 14.5c3.5 4.5 9 6.5 14.5 4s7-8.5 4-13c-.5-.8-1.5-.8-2 0-2.5 3.5-5.5 5-9.5 3s-6.5-.5-8 4c-.3.8.3 1.5 1 2z" opacity="0.85"/>
    </svg>
  ),
  Kirloskar: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="12" r="3"/>
      <path d="M12 2a10 10 0 0 0-7.07 2.93l1.41 1.41A8 8 0 0 1 12 4V2zm0 20a10 10 0 0 0 7.07-2.93l-1.41-1.41A8 8 0 0 1 12 20v2zm10-10a10 10 0 0 0-2.93-7.07l-1.41 1.41A8 8 0 0 1 20 12h2zM2 12a10 10 0 0 0 2.93 7.07l1.41-1.41A8 8 0 0 1 4 12H2zm3.5-3.5a8 8 0 0 1 1.4-1.4L5.5 5.7a10 10 0 0 0-2 2L5 9.2zm12 12a8 8 0 0 1-1.4 1.4l1.4 1.4a10 10 0 0 0 2-2l-2-2zM5.5 17.5a8 8 0 0 1-1.4-1.4L2.7 17.5a10 10 0 0 0 2 2l.8-.8zm12-12a8 8 0 0 1 1.4 1.4l1.4-1.4a10 10 0 0 0-2-2l-.8.8z"/>
    </svg>
  ),
  Sela: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M14.5 9.5c0-.83-.67-1.5-1.5-1.5H9.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5h6c.55 0 1-.45 1-1s-.45-1-1-1h-6C6.46 3 4 5.46 4 8.5S6.46 14 9.5 14h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-6c-.55 0-1 .45-1 1s.45 1 1 1h6c3.04 0 5.5-2.46 5.5-5.5s-2.46-5.5-5.5-5.5h-3c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5h3c.55 0 1 .45 1 1s-.45 1-1 1z"/>
    </svg>
  ),
  "Trovian Group": (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2L3 7v10l9 5 9-5V7l-9-5zm7 13.8L12 20l-7-4.2V8.2L12 4l7 4.2v7.6z"/>
      <path d="M12 7l4 2.5V14l-4 2.5L8 14V9.5L12 7zm0 2.5L9.5 11v2l2.5 1.5 2.5-1.5v-2L12 9.5z"/>
    </svg>
  ),
  "Asma Groups": (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <circle cx="8" cy="12" r="5" fill="none" stroke="currentColor" strokeWidth="2"/>
      <circle cx="16" cy="12" r="5" fill="none" stroke="currentColor" strokeWidth="2"/>
      <circle cx="12" cy="8" r="5" fill="none" stroke="currentColor" strokeWidth="2"/>
    </svg>
  ),
  LogicMo: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <rect x="3" y="3" width="6" height="6" rx="1.5"/>
      <rect x="15" y="3" width="6" height="6" rx="1.5"/>
      <rect x="3" y="15" width="6" height="6" rx="1.5"/>
      <rect x="15" y="15" width="6" height="6" rx="1.5"/>
      <path d="M9 6h6M6 9v6M18 9v6M9 18h6" stroke="currentColor" strokeWidth="2" strokeDasharray="1 2"/>
    </svg>
  ),
  "Greensol Tech": (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-2.4 1.1-4.6 2.9-6.1l1.4 1.4c-1.4 1.2-2.3 2.9-2.3 4.7 0 3.3 2.7 6 6 6 1.8 0 3.5-.9 4.7-2.3l1.4 1.4c-1.5 1.8-3.7 2.9-6.1 2.9zm5-7.93c0-2.8-2.2-5-5-5s-5 2.2-5 5v2h10v-2z"/>
    </svg>
  ),
  "Qianyi Rail": (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M4 22l4-16h8l4 16H4zm7.5-14H8.5l-.5 2h4l-.5-2zm-1 4H7.5l-.5 2h5l-1-2zm-1 4H6.5l-.5 2h6l-1-2zm7-8h-3l-.5 2h4l-.5-2zm1 4h-3.5l-.5 2h4.5l-.5-2zm1 4h-4l-.5 2h5.5l-1-2z"/>
    </svg>
  ),
  "Advika Aircon": (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <rect x="2" y="2" width="20" height="20" rx="3" fill="none" stroke="currentColor" strokeWidth="2"/>
      <circle cx="12" cy="12" r="3"/>
      <path d="M12 12c0-3.5 1.5-5 4-5s1.5 3 0 5-4 0-4 0zm0 0c3.5 0 5 1.5 5 4s-3 1.5-5 0 0-4 0-4zm0 0c0 3.5-1.5 5-4 5s-1.5-3 0-5 4 0 4 0zm0 0c-3.5 0-5-1.5-5-4s3-1.5 5 0 0 4 0 4z"/>
    </svg>
  ),
  "Hira Automation": (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2L2 12l10 10 10-10L12 2zm0 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/>
      <path d="M12 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z"/>
      <path d="M11 6h2v1.5h-2V6zm0 10.5h2V22h-2v-5.5zM5.5 11h1.5v2H5.5v-2zm10.5 0h1.5v2H16v-2z" opacity="0.8"/>
    </svg>
  ),
  "MB Automation": (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M3 5v14h18V5H3zm7 11H5v-2h5v2zm0-4H5V8h5v4zm9 4h-7v-8h7v8z"/>
      <circle cx="14" cy="10" r="1.5"/>
      <circle cx="17" cy="12" r="1.5"/>
    </svg>
  ),
  "Just In Gadgets": (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <rect x="3" y="5" width="8" height="14" rx="1.5" fill="none" stroke="currentColor" strokeWidth="2"/>
      <rect x="14" y="8" width="7" height="8" rx="1" fill="none" stroke="currentColor" strokeWidth="2"/>
      <path d="M16 8V5h3v3M16 16v3h3v-3M7 16h.01"/>
    </svg>
  ),
  "Komal Systems": (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <ellipse cx="12" cy="6" rx="7" ry="2.5" fill="none" stroke="currentColor" strokeWidth="2"/>
      <path d="M5 6v5c0 1.38 3.13 2.5 7 2.5s7-1.12 7-2.5V6" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M5 11v5c0 1.38 3.13 2.5 7 2.5s7-1.12 7-2.5v-5" fill="none" stroke="currentColor" stroke-width="2"/>
    </svg>
  ),
  "Snuggles Preschool": (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="13" r="7"/>
      <circle cx="6" cy="7" r="3"/>
      <circle cx="18" cy="7" r="3"/>
      <circle cx="12" cy="14" r="2.5" fill="#f9f7f4"/>
      <circle cx="12" cy="13" r="1"/>
      <circle cx="9.5" cy="11" r="0.8"/>
      <circle cx="14.5" cy="11" r="0.8"/>
    </svg>
  ),
  "Rajwadi Samosa": (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2L1 21h22L12 2zm0 4.88L19.8 19H4.2L12 6.88z"/>
      <path d="M12 8.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM9 14h6v1.5H9V14z"/>
    </svg>
  ),
  "Ved Brahma": (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 21a9 9 0 0 1-9-9c0-4.97 4.03-9 9-9s9 4.03 9 9a9 9 0 0 1-9 9zm0-15c-3.3 0-6 2.7-6 6s2.7 6 6 6 6-2.7 6-6-2.7-6-6-6zm0 10c-2.2 0-4-1.8-4-4s1.8-4 4-4 4 1.8 4 4-1.8 4-4 4z"/>
    </svg>
  ),
  DES: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C7 4 4 7 4 11c0 5 4.5 9 8 11 3.5-2 8-6 8-11 0-4-3-7-8-9zm0 2.2c3.5 1.6 5.8 4 5.8 6.8 0 3.7-3.3 7-5.8 8.7-2.5-1.7-5.8-5-5.8-8.7 0-2.8 2.3-5.2 5.8-6.8z"/>
      <path d="M9 9.5h6v4H9v-4zm1.5 1.5v1h3v-1h-3z"/>
    </svg>
  ),
  Suroj: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14.5a3.5 3.5 0 0 1-3.5-3.5h2c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-1a1.5 1.5 0 0 0-1.5-1.5h-1a3.5 3.5 0 0 1-3.5-3.5v-1a3.5 3.5 0 0 1 3.5-3.5 3.5 3.5 0 0 1 3.5 3.5h-2c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v1a1.5 1.5 0 0 0 1.5 1.5h1a3.5 3.5 0 0 1 3.5 3.5v1a3.5 3.5 0 0 1-3.5 3.5z"/>
    </svg>
  ),
  "Rama Agrotech": (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8zm-1-12c-2.2 0-4 1.8-4 4s1.8 4 4 4c1 0 2-.4 2.8-1l-1.4-1.4c-.4.3-.9.4-1.4.4-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2h2c0-2.2-1.8-4-4-4z"/>
      <path d="M12 10a2 2 0 1 0 2 2 2 2 0 0 0-2-2z"/>
    </svg>
  ),
};

const ROW_ONE = [
  { name: "Google", tier: "enterprise" },
  { name: "SBI", tier: "enterprise" },
  { name: "AWS", tier: "enterprise" },
  { name: "IRCTC", tier: "enterprise" },
  { name: "Škoda", tier: "enterprise" },
  { name: "Kirloskar", tier: "premium" },
  { name: "Sela", tier: "premium" },
  { name: "Trovian Group", tier: "premium" },
  { name: "Asma Groups", tier: "premium" },
  { name: "LogicMo", tier: "standard" },
  { name: "Greensol Tech", tier: "standard" },
  { name: "Qianyi Rail", tier: "standard" },
];

const ROW_TWO = [
  { name: "Advika Aircon", tier: "standard" },
  { name: "Hira Automation", tier: "standard" },
  { name: "MB Automation", tier: "standard" },
  { name: "Just In Gadgets", tier: "standard" },
  { name: "Komal Systems", tier: "standard" },
  { name: "Snuggles Preschool", tier: "standard" },
  { name: "Rajwadi Samosa", tier: "standard" },
  { name: "Ved Brahma", tier: "standard" },
  { name: "DES", tier: "standard" },
  { name: "Suroj", tier: "standard" },
  { name: "Rama Agrotech", tier: "standard" },
];

// Helper to retrieve brand logo with a beautiful fallback
function getBrandLogo(name: string) {
  return BRAND_LOGOS[name] || (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="2.5"/>
      <circle cx="12" cy="12" r="3" fill="currentColor"/>
    </svg>
  );
}

function MarqueeRow({
  items,
  direction = "left",
  speed = 35,
}: {
  items: typeof ROW_ONE;
  direction?: "left" | "right";
  speed?: number;
}) {
  // Duplicate items 3x for seamless infinite loop
  const tripled = [...items, ...items, ...items];

  return (
    <div className={styles.rowWrapper}>
      <div
        className={`${styles.rowTrack} ${direction === "right" ? styles.rowReverse : ""}`}
        style={{ animationDuration: `${speed}s` }}
      >
        {tripled.map((brand, i) => {
          const logo = getBrandLogo(brand.name);
          return (
            <div
              key={`${brand.name}-${i}`}
              className={`${styles.brandPill} ${styles[`tier_${brand.tier}`]}`}
            >
              <span className={styles.brandLogo} aria-hidden="true">
                {logo}
              </span>
              <span className={styles.brandName}>{brand.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ClientLogos() {
  const [mounted, setMounted] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    setMounted(true);
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setInView(true);
      },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className={styles.section}>
      {/* Header */}
      <div className={`${styles.header} ${inView ? styles.headerVisible : ""}`}>
        <p className={styles.eyebrow}>Trusted Across Industries</p>
        <h2 className={styles.heading}>
          Worn by India's Most Recognised Names
        </h2>
        <p className={styles.subheading}>
          From Fortune-500 corporations to fast-growing startups — our garments represent their brand every day.
        </p>
      </div>

      {/* Marquee rows */}
      {mounted ? (
        <div className={styles.marqueeContainer}>
          <MarqueeRow items={ROW_ONE} direction="left" speed={40} />
          <MarqueeRow items={ROW_TWO} direction="right" speed={32} />
        </div>
      ) : (
        /* SSR fallback — static first row */
        <div className={styles.marqueeContainer}>
          <div className={styles.rowWrapper}>
            <div className={styles.rowTrack}>
              {ROW_ONE.map((brand) => {
                const logo = getBrandLogo(brand.name);
                return (
                  <div key={brand.name} className={styles.brandPill}>
                    <span className={styles.brandLogo} aria-hidden="true">
                      {logo}
                    </span>
                    <span className={styles.brandName}>{brand.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Stats caption */}
      <div className={`${styles.footer} ${inView ? styles.footerVisible : ""}`}>
        <span className={styles.footerStat}>25+ Brands</span>
        <span className={styles.footerDivider} aria-hidden="true" />
        <span className={styles.footerText}>across IT, Automotive, FMCG, Education & more</span>
      </div>
    </section>
  );
}
