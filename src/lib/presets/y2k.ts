import { TextPreset } from "../text-presets";

export const Y2K_PRESETS: TextPreset[] = [
  {
    id: "y2k-matrix",
    category: "y2k",
    name: "THE MATRIX",
    width: 250,
    height: 180,
    elements: [
      {
        type: "text",
        value: "SYSTEM",
        fontFamily: "Orbitron",
        fontWeight: "900",
        color: "#4ADE80", // Hacker Green
        backgroundColor: "#000000",
        padding: "10px 20px",
        fontSize: 45,
        letterSpacing: 8,
        y: 10,
        width: 250,
        height: 70,
        textAlign: "center"
      },
      {
        type: "text",
        value: "FAILURE",
        fontFamily: "Orbitron",
        fontWeight: "700",
        color: "#000000",
        backgroundColor: "#4ADE80", // Inverted hacker green
        padding: "10px 20px",
        fontSize: 45,
        letterSpacing: 8,
        y: 90,
        width: 250,
        height: 70,
        textAlign: "center"
      }
    ]
  },
  {
    id: "y2k-bubblegum",
    category: "y2k",
    name: "BUBBLEGUM POP",
    width: 320,
    height: 140,
    elements: [
      {
        type: "text",
        value: "PLASTIC",
        fontFamily: "Righteous",
        color: "#EC4899", // Hot pink
        WebkitTextStroke: "3px #FFFFFF",
        textShadow: "4px 4px 0px #A855F7", // Purple drop shadow
        fontSize: 65,
        y: 10,
        x: -20,
        width: 320,
        height: 80,
        textAlign: "center"
      },
      {
        type: "text",
        value: "WORLD",
        fontFamily: "Righteous",
        color: "#3B82F6", // Blue
        WebkitTextStroke: "3px #FFFFFF",
        textShadow: "4px 4px 0px #EC4899", // Pink drop shadow
        fontSize: 55,
        y: 70,
        x: 30,
        width: 320,
        height: 70,
        textAlign: "center"
      }
    ]
  },
  {
    id: "y2k-cyber",
    category: "y2k",
    name: "CYBER GLITCH",
    width: 300,
    height: 120,
    elements: [
      {
        type: "text",
        value: "VIRTUAL",
        fontFamily: "Bungee",
        color: "#F8FAFC", // Almost white
        textShadow: "-4px 0px 0px #06B6D4, 4px 0px 0px #F43F5E", // Cyan & Rose split
        fontSize: 60,
        y: 10,
        width: 300,
        height: 70,
        textAlign: "center"
      },
      {
        type: "text",
        value: "REALITY 2.0",
        fontFamily: "Inter",
        fontWeight: "900",
        color: "#06B6D4",
        fontSize: 16,
        letterSpacing: 8,
        y: 80,
        width: 300,
        height: 30,
        textAlign: "center"
      }
    ]
  },
  {
    id: "y2k-trance",
    category: "y2k",
    name: "TECH TRANCE",
    width: 350,
    height: 100,
    elements: [
      {
        type: "text",
        value: "MILLENNIUM",
        fontFamily: "Inter",
        fontWeight: "900",
        fontStyle: "italic",
        color: "transparent",
        backgroundImage: "linear-gradient(90deg, #94A3B8 0%, #F1F5F9 50%, #94A3B8 100%)", // Metallic silver
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        fontSize: 50,
        letterSpacing: 6,
        y: 10,
        width: 350,
        height: 70,
        textAlign: "center",
        textTransform: "uppercase",
        borderTop: "2px solid #CBD5E1",
        borderBottom: "2px solid #CBD5E1",
        padding: "8px 0"
      }
    ]
  },
  {
    id: "y2k-skater",
    category: "y2k",
    name: "SKATER PUNK",
    width: 280,
    height: 200,
    elements: [
      {
        type: "text",
        value: "CHAOS",
        fontFamily: "Permanent Marker",
        color: "#EF4444", // Red
        fontSize: 70,
        y: 10,
        x: -20,
        width: 280,
        height: 90,
        textAlign: "center"
      },
      {
        type: "text",
        value: "THEORY",
        fontFamily: "Permanent Marker",
        color: "#000000",
        backgroundColor: "#FEF08A", // Yellow tape look
        padding: "5px 15px",
        fontSize: 50,
        y: 90,
        x: 20,
        width: 280,
        height: 80,
        textAlign: "center"
      }
    ]
  }
];
