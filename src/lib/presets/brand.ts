import { TextPreset } from "../text-presets";

export const BRAND_PRESETS: TextPreset[] = [
  {
    id: "brand-luxury",
    category: "brand",
    name: "HIGH FASHION",
    width: 350,
    height: 120,
    elements: [
      {
        type: "text",
        value: "LUXURY",
        fontFamily: "Montserrat",
        fontWeight: "300",
        color: "#111827", // Almost black
        letterSpacing: 25,
        fontSize: 35,
        y: 10,
        width: 350,
        height: 50,
        textAlign: "center",
        textTransform: "uppercase"
      },
      {
        type: "text",
        value: "PARIS - MILAN - TOKYO",
        fontFamily: "Inter",
        fontWeight: "400",
        color: "#6B7280", // Gray
        letterSpacing: 6,
        fontSize: 10,
        y: 70,
        width: 350,
        height: 20,
        textAlign: "center"
      }
    ]
  },
  {
    id: "brand-streetwear",
    category: "brand",
    name: "STREETWEAR",
    width: 250,
    height: 180,
    elements: [
      {
        type: "text",
        value: "STREET",
        fontFamily: "Oswald",
        fontWeight: "900",
        color: "#000000",
        fontSize: 80,
        lineHeight: 0.9,
        y: 10,
        width: 250,
        height: 80,
        textAlign: "center"
      },
      {
        type: "text",
        value: "WEAR",
        fontFamily: "Oswald",
        fontWeight: "900",
        color: "transparent",
        WebkitTextStroke: "2px #000000",
        fontSize: 80,
        lineHeight: 0.9,
        y: 85,
        width: 250,
        height: 80,
        textAlign: "center"
      }
    ]
  },
  {
    id: "brand-tech",
    category: "brand",
    name: "TECH STARTUP",
    width: 300,
    height: 100,
    elements: [
      {
        type: "text",
        value: "INNOVATE",
        fontFamily: "Outfit",
        fontWeight: "700",
        color: "transparent",
        backgroundImage: "linear-gradient(90deg, #3B82F6 0%, #8B5CF6 100%)", // Blue to purple gradient
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        fontSize: 60,
        letterSpacing: -2,
        y: 10,
        width: 300,
        height: 70,
        textAlign: "center"
      },
      {
        type: "text",
        value: "TECHNOLOGIES",
        fontFamily: "Outfit",
        fontWeight: "900",
        color: "#111827",
        fontSize: 20,
        letterSpacing: 10,
        y: 75,
        width: 300,
        height: 30,
        textAlign: "center"
      }
    ]
  },
  {
    id: "brand-organic",
    category: "brand",
    name: "ORGANIC CO.",
    width: 280,
    height: 130,
    elements: [
      {
        type: "text",
        value: "botanical",
        fontFamily: "Lora",
        fontStyle: "italic",
        fontWeight: "500",
        color: "#166534", // Deep green
        fontSize: 50,
        y: 10,
        width: 280,
        height: 60,
        textAlign: "center"
      },
      {
        type: "text",
        value: "SKINCARE & WELLNESS",
        fontFamily: "Inter",
        fontWeight: "600",
        color: "#4ADE80", // Light green
        fontSize: 12,
        letterSpacing: 4,
        y: 80,
        width: 280,
        height: 20,
        textAlign: "center",
        borderTop: "1px solid #BBF7D0",
        padding: "8px 0"
      }
    ]
  },
  {
    id: "brand-activewear",
    category: "brand",
    name: "ATHLEISURE",
    width: 320,
    height: 120,
    elements: [
      {
        type: "text",
        value: "MOTION",
        fontFamily: "Bebas Neue",
        color: "#F43F5E", // Rose red
        fontSize: 85,
        fontStyle: "italic", // Skewed aggressive look
        letterSpacing: 6,
        y: 10,
        width: 320,
        height: 90,
        textAlign: "center",
        textShadow: "4px 0px 0px #000000" // Speed lines effect
      }
    ]
  }
];
