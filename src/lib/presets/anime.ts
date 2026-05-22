import { TextPreset } from "../text-presets";

export const ANIME_PRESETS: TextPreset[] = [
  {
    id: "anime-shinobi",
    category: "anime",
    name: "THE SHINOBI",
    width: 300,
    height: 150,
    elements: [
      {
        type: "text",
        value: "HIDDEN",
        fontFamily: "Shojumaru",
        color: "#F97316", // Vibrant Orange
        WebkitTextStroke: "4px #FFFFFF",
        textShadow: "6px 6px 0px #1E3A8A", // Deep Blue Extrusion
        fontSize: 50,
        y: 10,
        width: 300,
        height: 60,
        textAlign: "center"
      },
      {
        type: "text",
        value: "LEAF",
        fontFamily: "Shojumaru",
        color: "#F97316",
        WebkitTextStroke: "4px #FFFFFF",
        textShadow: "6px 6px 0px #1E3A8A",
        fontSize: 70,
        y: 70,
        width: 300,
        height: 80,
        textAlign: "center"
      }
    ]
  },
  {
    id: "anime-saiyan",
    category: "anime",
    name: "SUPER SAIYAN",
    width: 350,
    height: 160,
    elements: [
      {
        type: "text",
        value: "SUPER",
        fontFamily: "Black Ops One",
        color: "transparent",
        backgroundImage: "linear-gradient(180deg, #EF4444 0%, #FBBF24 100%)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        WebkitTextStroke: "2px #991B1B", // Dark red border
        textShadow: "8px 8px 0px #000000", // Hard black extrusion
        fontSize: 55,
        fontStyle: "italic",
        y: 10,
        width: 350,
        height: 60,
        textAlign: "center"
      },
      {
        type: "text",
        value: "SAIYAN",
        fontFamily: "Black Ops One",
        color: "transparent",
        backgroundImage: "linear-gradient(180deg, #EF4444 0%, #FBBF24 100%)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        WebkitTextStroke: "2px #991B1B",
        textShadow: "8px 8px 0px #000000",
        fontSize: 65,
        fontStyle: "italic",
        y: 75,
        width: 350,
        height: 70,
        textAlign: "center"
      }
    ]
  },
  {
    id: "anime-runner",
    category: "anime",
    name: "NEON RUNNER",
    width: 350,
    height: 120,
    elements: [
      {
        type: "text",
        value: "NIGHT",
        fontFamily: "Orbitron",
        fontWeight: "900",
        color: "#FEF08A",
        textShadow: "3px 3px 0px #EC4899, -3px -3px 0px #06B6D4", // Magenta & Cyan glitch
        fontSize: 60,
        fontStyle: "italic",
        letterSpacing: 4,
        y: 10,
        x: -20,
        width: 350,
        height: 70,
        textAlign: "center"
      },
      {
        type: "text",
        value: "CITY",
        fontFamily: "Orbitron",
        fontWeight: "900",
        color: "#FEF08A",
        textShadow: "3px 3px 0px #EC4899, -3px -3px 0px #06B6D4",
        fontSize: 60,
        fontStyle: "italic",
        letterSpacing: 4,
        y: 50,
        x: 20,
        width: 350,
        height: 70,
        textAlign: "center"
      }
    ]
  },
  {
    id: "anime-mech",
    category: "anime",
    name: "MECH PILOT",
    width: 250,
    height: 200,
    elements: [
      {
        type: "text",
        value: "EVANGEL",
        fontFamily: "Oswald",
        fontWeight: "900",
        color: "#86EFAC", // Neon green
        WebkitTextStroke: "2px #9333EA", // Purple
        backgroundColor: "#111827", // Solid black block
        padding: "8px 20px",
        fontSize: 45,
        letterSpacing: 8,
        y: 10,
        width: 250,
        height: 80,
        textAlign: "center"
      },
      {
        type: "text",
        value: "UNIT-01",
        fontFamily: "Oswald",
        fontWeight: "700",
        color: "#FFFFFF",
        backgroundColor: "#9333EA", // Purple block
        padding: "4px 20px",
        fontSize: 30,
        letterSpacing: 10,
        y: 110,
        width: 250,
        height: 60,
        textAlign: "center"
      }
    ]
  },
  {
    id: "anime-demon",
    category: "anime",
    name: "DEMON HUNTER",
    width: 300,
    height: 180,
    elements: [
      {
        type: "text",
        value: "DEMON",
        fontFamily: "Permanent Marker",
        color: "#000000",
        WebkitTextStroke: "1px #FFFFFF",
        textShadow: "0px 0px 15px #DC2626", // Deep red glow
        fontSize: 65,
        y: 10,
        width: 300,
        height: 80,
        textAlign: "center"
      },
      {
        type: "text",
        value: "SLAYER",
        fontFamily: "Bangers", // Heavy block font for contrast
        color: "#DC2626",
        textShadow: "4px 4px 0px #000000",
        fontSize: 70,
        y: 90,
        width: 300,
        height: 80,
        textAlign: "center",
        letterSpacing: 5
      }
    ]
  }
];
