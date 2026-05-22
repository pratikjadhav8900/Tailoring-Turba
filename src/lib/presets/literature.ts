import { TextPreset } from "../text-presets";

export const LITERATURE_PRESETS: TextPreset[] = [
  {
    id: "lit-novel",
    category: "literature",
    name: "THE NOVEL",
    width: 320,
    height: 180,
    elements: [
      {
        type: "text",
        value: "ONCE UPON",
        fontFamily: "Playfair Display",
        fontWeight: "900",
        color: "#000000",
        fontSize: 50,
        letterSpacing: 2,
        y: 10,
        width: 320,
        height: 60,
        textAlign: "center"
      },
      {
        type: "text",
        value: "A TIME...",
        fontFamily: "Playfair Display",
        fontWeight: "400",
        fontStyle: "italic",
        color: "#4B5563",
        fontSize: 40,
        y: 70,
        width: 320,
        height: 50,
        textAlign: "center"
      }
    ]
  },
  {
    id: "lit-manuscript",
    category: "literature",
    name: "THE MANUSCRIPT",
    width: 300,
    height: 140,
    elements: [
      {
        type: "text",
        value: "Handwritten",
        fontFamily: "Caveat",
        color: "#1E3A8A", // Ink blue
        fontSize: 70,
        y: 10,
        x: -20,
        width: 300,
        height: 80,
        textAlign: "center",
        textShadow: "1px 1px 2px rgba(30, 58, 138, 0.2)" // Subtle ink bleed
      },
      {
        type: "text",
        value: "NOTES",
        fontFamily: "Montserrat",
        fontWeight: "600",
        color: "#000000",
        fontSize: 30,
        letterSpacing: 15,
        y: 85,
        x: 20,
        width: 300,
        height: 40,
        textAlign: "center"
      }
    ]
  },
  {
    id: "lit-encyclopedia",
    category: "literature",
    name: "THE ENCYCLOPEDIA",
    width: 340,
    height: 180,
    elements: [
      {
        type: "text",
        value: "ENCYCLOPEDIA",
        fontFamily: "Cormorant Garamond",
        fontWeight: "700",
        color: "#111827",
        fontSize: 38,
        letterSpacing: 2,
        y: 10,
        width: 340,
        height: 50,
        textAlign: "center"
      },
      {
        type: "text",
        value: "Vol. IV",
        fontFamily: "Cormorant Garamond",
        fontStyle: "italic",
        fontWeight: "400",
        color: "#4B5563",
        fontSize: 24,
        y: 55,
        width: 340,
        height: 35,
        textAlign: "center"
      },
      {
        type: "text",
        value: "A Comprehensive Guide to the Known World",
        fontFamily: "Inter",
        fontWeight: "300",
        color: "#6B7280",
        fontSize: 10,
        letterSpacing: 1,
        y: 110,
        width: 340,
        height: 20,
        textAlign: "center",
        borderTop: "1px solid #D1D5DB",
        padding: "10px 0"
      }
    ]
  },
  {
    id: "lit-poetry",
    category: "literature",
    name: "THE POETRY",
    width: 280,
    height: 160,
    elements: [
      {
        type: "text",
        value: "Silent",
        fontFamily: "Alegreya",
        fontStyle: "italic",
        color: "#111827",
        fontSize: 45,
        y: 10,
        x: -40,
        width: 280,
        height: 60,
        textAlign: "center"
      },
      {
        type: "text",
        value: "Whispers",
        fontFamily: "Alegreya",
        fontStyle: "italic",
        color: "#6B7280",
        fontSize: 45,
        y: 65,
        x: 40,
        width: 280,
        height: 60,
        textAlign: "center"
      }
    ]
  },
  {
    id: "lit-typewriter",
    category: "literature",
    name: "THE TYPEWRITER",
    width: 320,
    height: 140,
    elements: [
      {
        type: "text",
        value: "CONFIDENTIAL",
        fontFamily: "Courier New", // Monospaced
        fontWeight: "bold",
        color: "#991B1B", // Red ink stamp
        fontSize: 35,
        letterSpacing: 4,
        y: 10,
        width: 320,
        height: 50,
        textAlign: "center",
        borderBottom: "2px solid #991B1B"
      },
      {
        type: "text",
        value: "FILE NO. 409-B\nCLASSIFIED INFORMATION",
        fontFamily: "Courier New",
        color: "#111827",
        fontSize: 18,
        letterSpacing: 2,
        lineHeight: 1.5,
        y: 70,
        width: 320,
        height: 60,
        textAlign: "center"
      }
    ]
  }
];
