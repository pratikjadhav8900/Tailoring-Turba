import { TextPreset } from "../text-presets";

export const VINTAGE_PRESETS: TextPreset[] = [
  {
    id: "vintage-diner",
    category: "vintage",
    name: "THE DINER",
    width: 250,
    height: 150,
    elements: [
      {
        type: "text",
        value: "RETRO",
        fontFamily: "Righteous",
        color: "#DC2626", // Classic Red
        fontSize: 60,
        y: 10,
        width: 250,
        height: 60,
        textAlign: "center",
        textShadow: "2px 2px 0px #FCA5A5", // Soft red shadow
      },
      {
        type: "text",
        value: "DINER",
        fontFamily: "Inter",
        fontWeight: "900",
        color: "#FEF3C7", // Cream
        backgroundColor: "#111827", // Dark block
        padding: "4px 16px",
        letterSpacing: 10,
        fontSize: 25,
        y: 80,
        width: 250,
        height: 40,
        textAlign: "center"
      }
    ]
  },
  {
    id: "vintage-barbershop",
    category: "vintage",
    name: "THE BARBERSHOP",
    width: 300,
    height: 160,
    elements: [
      {
        type: "text",
        value: "CLASSIC",
        fontFamily: "Oswald",
        fontWeight: "700",
        color: "#111827",
        letterSpacing: 12,
        fontSize: 25,
        y: 10,
        width: 300,
        height: 35,
        textAlign: "center"
      },
      {
        type: "text",
        value: "CUTS",
        fontFamily: "Abril Fatface",
        color: "#111827",
        fontSize: 70,
        y: 45,
        width: 300,
        height: 80,
        textAlign: "center",
        borderTop: "3px solid #111827",
        borderBottom: "3px solid #111827",
        padding: "10px 0px"
      }
    ]
  },
  {
    id: "vintage-garage",
    category: "vintage",
    name: "THE GARAGE",
    width: 280,
    height: 140,
    elements: [
      {
        type: "text",
        value: "RUSTY'S",
        fontFamily: "Anton",
        color: "#000000",
        backgroundColor: "#FBBF24", // Industrial Yellow
        padding: "8px 12px",
        fontSize: 55,
        y: 10,
        x: -15,
        width: 280,
        height: 70,
        textAlign: "center"
      },
      {
        type: "text",
        value: "GARAGE",
        fontFamily: "Anton",
        color: "#FBBF24",
        backgroundColor: "#000000",
        padding: "8px 12px",
        fontSize: 55,
        y: 70,
        x: 15,
        width: 280,
        height: 70,
        textAlign: "center"
      }
    ]
  },
  {
    id: "vintage-tailor",
    category: "vintage",
    name: "THE TAILOR",
    width: 260,
    height: 160,
    elements: [
      {
        type: "text",
        value: "Custom",
        fontFamily: "Alex Brush",
        color: "#D97706", // Gold
        fontSize: 55,
        y: 10,
        width: 260,
        height: 70,
        textAlign: "center"
      },
      {
        type: "text",
        value: "TAILORING",
        fontFamily: "Cormorant Garamond",
        fontWeight: "600",
        color: "#1F2937",
        fontSize: 30,
        letterSpacing: 8,
        y: 80,
        width: 260,
        height: 40,
        textAlign: "center"
      },
      {
        type: "text",
        value: "EST. 1924",
        fontFamily: "Inter",
        fontWeight: "400",
        color: "#6B7280",
        fontSize: 14,
        letterSpacing: 4,
        y: 125,
        width: 260,
        height: 20,
        textAlign: "center"
      }
    ]
  },
  {
    id: "vintage-postcard",
    category: "vintage",
    name: "THE POSTCARD",
    width: 320,
    height: 180,
    elements: [
      {
        type: "text",
        value: "Greetings from",
        fontFamily: "Pacifico",
        color: "#1D4ED8", // Royal Blue
        fontSize: 35,
        y: 10,
        x: -40,
        width: 320,
        height: 50,
        textAlign: "center",
        textShadow: "1px 1px 0px #FFFFFF, 2px 2px 0px #93C5FD"
      },
      {
        type: "text",
        value: "MIAMI",
        fontFamily: "Anton",
        color: "#F43F5E", // Vibrant Pink/Red
        fontSize: 90,
        y: 55,
        width: 320,
        height: 100,
        textAlign: "center",
        WebkitTextStroke: "2px #FFFFFF",
        textShadow: "4px 4px 0px #FDE047" // Yellow shadow
      }
    ]
  }
];
