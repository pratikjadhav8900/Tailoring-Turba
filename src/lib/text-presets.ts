import { DesignElement } from "@/types/customizer";

export interface TextPreset {
  id: string;
  category?: string;
  name: string;
  width: number;
  height: number;
  elements: Partial<DesignElement>[];
}

export const TEXT_PRESETS: TextPreset[] = [
  // 1-10: Classic & Core (From earlier)
  {
    id: "sparkle", name: "Sparkle", width: 250, height: 80,
    elements: [
      { type: "text", value: "Sparkle", fontFamily: "Alex Brush", color: "#FFF9C4", fontSize: 60, textShadow: "0 0 10px #FFD54F, 0 0 20px #FFB300", width: 250, height: 80 }
    ]
  },
  {
    id: "call-now", name: "CALL NOW", width: 220, height: 110,
    elements: [
      { type: "text", value: "CALL", fontFamily: "Oswald", fontWeight: "bold", color: "#0D9488", fontSize: 90, letterSpacing: 2, width: 180, height: 110, y: -10 },
      { type: "text", value: "NOW", fontFamily: "Inter", fontWeight: "bold", color: "#000000", backgroundColor: "#E9D5FF", padding: "4px 12px", fontSize: 24, letterSpacing: 4, width: 90, height: 35, x: 40, y: 20 }
    ]
  },
  {
    id: "24-7-open", name: "24/7 Open", width: 200, height: 100,
    elements: [
      { type: "text", value: "24/7", fontFamily: "Inter", fontWeight: "bold", color: "#FDF4FF", fontSize: 70, textShadow: "0 0 15px #D946EF, 0 0 30px #C026D3", width: 200, height: 90 },
      { type: "text", value: "Open", fontFamily: "Alex Brush", color: "#FFFFFF", fontSize: 65, width: 180, height: 80, x: 10, y: 20 }
    ]
  },
  {
    id: "comic-cartoon", name: "COMIC CARTOON", width: 200, height: 100,
    elements: [
      { type: "text", value: "COMIC", fontFamily: "Aladin", color: "#FFFFFF", WebkitTextStroke: "2px #2DD4BF", textShadow: "3px 3px 0 #2DD4BF", fontSize: 55, width: 200, height: 65, y: -20 },
      { type: "text", value: "CARTOON", fontFamily: "Aladin", color: "#EC4899", fontSize: 40, width: 200, height: 50, y: 25 }
    ]
  },
  {
    id: "bride-groom", name: "Bride & Groom", width: 220, height: 120,
    elements: [
      { type: "text", value: "Bride &\nGROOM", fontFamily: "Playfair Display", fontStyle: "italic", color: "#064E3B", fontSize: 45, lineHeight: 1.1, width: 220, height: 120 }
    ]
  },
  {
    id: "hiring", name: "We're Hiring!", width: 200, height: 110,
    elements: [
      { type: "text", value: "We're\nHiring!", fontFamily: "Outfit", fontWeight: "bold", color: "#1D4ED8", fontSize: 50, lineHeight: 1.0, width: 200, height: 110, letterSpacing: -1 }
    ]
  },
  {
    id: "plush-pen", name: "plush pen", width: 200, height: 110,
    elements: [
      { type: "text", value: "plush\npen", fontFamily: "Poppins", fontWeight: "bold", color: "#FFFFFF", fontSize: 55, lineHeight: 0.9, textShadow: "0 0 15px #F472B6, 0 0 25px #EC4899", width: 200, height: 110 }
    ]
  },
  {
    id: "memo", name: "Official Memo", width: 250, height: 120,
    elements: [
      { type: "text", value: "ASTERISK MEDIA", fontFamily: "Montserrat", fontWeight: "bold", color: "#000000", fontSize: 12, letterSpacing: 2, width: 250, height: 20, y: -40 },
      { type: "text", value: "Official Memo", fontFamily: "Playfair Display", color: "#000000", fontSize: 40, width: 250, height: 60 },
      { type: "text", value: "Re: Status Report Meeting\nDate: January 12", fontFamily: "Inter", color: "#000000", fontSize: 10, width: 250, height: 40, textAlign: "left", y: 40 }
    ]
  },
  {
    id: "subscribe", name: "Subscribe", width: 260, height: 90,
    elements: [
      { type: "text", value: "DON'T FORGET TO\nSUBSCRIBE", fontFamily: "Bebas Neue", color: "#FACC15", fontSize: 40, lineHeight: 1.0, letterSpacing: 1, width: 260, height: 90 }
    ]
  },
  {
    id: "road-trip", name: "Road Trip", width: 220, height: 60,
    elements: [
      { type: "text", value: "Road trip >", fontFamily: "Inter", fontWeight: "bold", color: "#FFFFFF", backgroundColor: "#10B981", padding: "12px 24px", borderRadius: "16px", fontSize: 30, width: 220, height: 60 }
    ]
  },

  // 11-20: Neon & Glow variants
  {
    id: "cyberpunk", name: "Cyberpunk", width: 240, height: 80,
    elements: [
      { type: "text", value: "CYBER", fontFamily: "Montserrat", fontWeight: "bold", color: "#00FFFF", fontSize: 50, letterSpacing: 5, textShadow: "2px 2px 0px #FF00FF, -2px -2px 0px #FFFF00", width: 240, height: 80 }
    ]
  },
  {
    id: "miami-nights", name: "Miami Nights", width: 200, height: 100,
    elements: [
      { type: "text", value: "MIAMI", fontFamily: "Bebas Neue", color: "#FFFFFF", fontSize: 70, WebkitTextStroke: "2px #FF1493", width: 200, height: 70, y: -15 },
      { type: "text", value: "nights", fontFamily: "Alex Brush", color: "#00FFFF", fontSize: 60, textShadow: "0 0 10px #00FFFF", width: 200, height: 70, y: 15 }
    ]
  },
  {
    id: "neon-sign", name: "Neon Sign", width: 220, height: 90,
    elements: [
      { type: "text", value: "OPEN", fontFamily: "Oswald", fontWeight: "bold", color: "#FFF", fontSize: 80, textShadow: "0 0 5px #fff, 0 0 10px #fff, 0 0 20px #0fa, 0 0 40px #0fa", width: 220, height: 90 }
    ]
  },
  {
    id: "retro-wave", name: "Retro Wave", width: 250, height: 100,
    elements: [
      { type: "text", value: "RETRO", fontFamily: "Montserrat", fontWeight: "bold", color: "#FF9000", fontSize: 60, textShadow: "0 4px 0 #FF007F", width: 250, height: 70, y: -10 },
      { type: "text", value: "WAVE", fontFamily: "Montserrat", fontWeight: "bold", color: "#00E5FF", fontSize: 40, letterSpacing: 8, width: 250, height: 50, y: 30 }
    ]
  },
  {
    id: "electric-blue", name: "Electric Blue", width: 200, height: 120,
    elements: [
      { type: "text", value: "ELECTRIC\nBLUE", fontFamily: "Poppins", fontWeight: "bold", color: "#FFFFFF", fontSize: 45, lineHeight: 1.0, textShadow: "0 0 20px #3B82F6", width: 200, height: 120 }
    ]
  },
  {
    id: "alien-glow", name: "Alien Glow", width: 200, height: 80,
    elements: [
      { type: "text", value: "ALIEN", fontFamily: "Courier New", fontWeight: "bold", color: "#A3E635", fontSize: 60, letterSpacing: 10, textShadow: "0 0 15px #4D7C0F", width: 200, height: 80 }
    ]
  },
  {
    id: "pink-plastic", name: "Pink Plastic", width: 200, height: 80,
    elements: [
      { type: "text", value: "Plastic", fontFamily: "Pacifico", color: "#FBCFE8", fontSize: 50, textShadow: "2px 2px 4px #BE185D", width: 200, height: 80 }
    ]
  },
  {
    id: "holographic", name: "Holographic", width: 220, height: 80,
    elements: [
      { type: "text", value: "HOLO", fontFamily: "Outfit", fontWeight: "bold", color: "#E0E7FF", fontSize: 70, textShadow: "3px 3px 0 #818CF8, -3px -3px 0 #F472B6", width: 220, height: 80 }
    ]
  },
  {
    id: "lava-lamp", name: "Lava Lamp", width: 200, height: 120,
    elements: [
      { type: "text", value: "LAVA\nLAMP", fontFamily: "Abril Fatface", color: "#FEF08A", fontSize: 55, lineHeight: 0.9, textShadow: "0 0 20px #EF4444", width: 200, height: 120 }
    ]
  },
  {
    id: "deep-space", name: "Deep Space", width: 240, height: 60,
    elements: [
      { type: "text", value: "DEEP SPACE", fontFamily: "Inter", fontWeight: "bold", color: "#FFFFFF", fontSize: 40, letterSpacing: 4, backgroundColor: "#0F172A", padding: "10px 20px", borderRadius: "8px", width: 240, height: 60 }
    ]
  },

  // 21-30: Badges & Blocks (Boxed text)
  {
    id: "sale-badge", name: "Sale Badge", width: 160, height: 160,
    elements: [
      { type: "text", value: "50%\nOFF", fontFamily: "Oswald", fontWeight: "bold", color: "#FFFFFF", backgroundColor: "#EF4444", borderRadius: "50%", padding: "30px 20px", fontSize: 45, lineHeight: 1.0, width: 160, height: 160 }
    ]
  },
  {
    id: "warning-tape", name: "Warning Tape", width: 260, height: 50,
    elements: [
      { type: "text", value: " CAUTION ", fontFamily: "Arial Black", color: "#000000", backgroundColor: "#EAB308", fontSize: 35, letterSpacing: 2, padding: "4px 0", width: 260, height: 50 }
    ]
  },
  {
    id: "black-white-box", name: "Minimal Box", width: 200, height: 100,
    elements: [
      { type: "text", value: "THE", fontFamily: "Inter", fontWeight: "bold", color: "#FFFFFF", backgroundColor: "#000000", fontSize: 20, width: 60, height: 30, y: -25, x: -60 },
      { type: "text", value: "STANDARD", fontFamily: "Inter", fontWeight: "bold", color: "#000000", fontSize: 30, letterSpacing: 2, width: 200, height: 40, y: 15 }
    ]
  },
  {
    id: "ticket-stub", name: "Ticket", width: 220, height: 80,
    elements: [
      { type: "text", value: "ADMIT ONE", fontFamily: "Courier New", fontWeight: "bold", color: "#DC2626", backgroundColor: "#FEF2F2", WebkitTextStroke: "1px #DC2626", fontSize: 30, padding: "10px 20px", letterSpacing: 2, width: 220, height: 80 }
    ]
  },
  {
    id: "fashion-label", name: "Fashion Label", width: 180, height: 100,
    elements: [
      { type: "text", value: "EST. 2026", fontFamily: "Georgia", color: "#6B7280", fontSize: 12, letterSpacing: 3, width: 180, height: 20, y: -30 },
      { type: "text", value: "VOGUE", fontFamily: "Playfair Display", color: "#111111", fontSize: 45, width: 180, height: 60, y: 10 }
    ]
  },
  {
    id: "news-headline", name: "Headline", width: 260, height: 120,
    elements: [
      { type: "text", value: "BREAKING\nNEWS", fontFamily: "Impact", color: "#000000", fontSize: 60, lineHeight: 0.9, textAlign: "left", width: 260, height: 120 }
    ]
  },
  {
    id: "sport-jersey", name: "Sport Jersey", width: 200, height: 160,
    elements: [
      { type: "text", value: "TEAM", fontFamily: "Bebas Neue", color: "#FFFFFF", backgroundColor: "#1E3A5F", fontSize: 40, width: 200, height: 50, y: -45, borderRadius: "8px 8px 0 0" },
      { type: "text", value: "99", fontFamily: "Oswald", fontWeight: "bold", color: "#1E3A5F", fontSize: 100, width: 200, height: 110, y: 35 }
    ]
  },
  {
    id: "stamped", name: "Stamped", width: 220, height: 80,
    elements: [
      { type: "text", value: "APPROVED", fontFamily: "Courier New", fontWeight: "bold", color: "#16A34A", fontSize: 40, letterSpacing: 4, textShadow: "0 0 2px #16A34A", rotation: -5, width: 220, height: 80 }
    ]
  },
  {
    id: "video-game", name: "Video Game", width: 240, height: 100,
    elements: [
      { type: "text", value: "LEVEL UP", fontFamily: "Press Start 2P", color: "#FACC15", textShadow: "4px 4px 0 #EAB308", fontSize: 35, width: 240, height: 100 }
    ]
  },
  {
    id: "name-tag", name: "Name Tag", width: 220, height: 120,
    elements: [
      { type: "text", value: "HELLO\nmy name is", fontFamily: "Inter", fontWeight: "bold", color: "#FFFFFF", backgroundColor: "#EF4444", fontSize: 16, lineHeight: 1.2, padding: "8px", borderRadius: "12px 12px 0 0", width: 220, height: 50, y: -35 },
      { type: "text", value: "Alex", fontFamily: "Alex Brush", color: "#000000", backgroundColor: "#FFFFFF", fontSize: 50, width: 220, height: 70, y: 25, borderRadius: "0 0 12px 12px" }
    ]
  },

  // 31-40: Elegant & Script
  {
    id: "wedding-invite", name: "Wedding", width: 240, height: 140,
    elements: [
      { type: "text", value: "You are invited to", fontFamily: "Montserrat", color: "#9CA3AF", fontSize: 12, letterSpacing: 3, width: 240, height: 20, y: -45 },
      { type: "text", value: "The Wedding", fontFamily: "Great Vibes", color: "#D4AF37", fontSize: 50, width: 240, height: 70, y: 0 },
      { type: "text", value: "October 24th", fontFamily: "Montserrat", color: "#9CA3AF", fontSize: 12, letterSpacing: 3, width: 240, height: 20, y: 45 }
    ]
  },
  {
    id: "boutique", name: "Boutique", width: 200, height: 80,
    elements: [
      { type: "text", value: "La Boutique", fontFamily: "Playfair Display", fontStyle: "italic", color: "#111111", fontSize: 40, width: 200, height: 80 }
    ]
  },
  {
    id: "minimal-chic", name: "Minimal Chic", width: 220, height: 80,
    elements: [
      { type: "text", value: "C H I C", fontFamily: "Lato", fontWeight: "bold", color: "#111111", fontSize: 40, letterSpacing: 10, width: 220, height: 80 }
    ]
  },
  {
    id: "coffee-shop", name: "Coffee Shop", width: 180, height: 180,
    elements: [
      { type: "text", value: "EST.", fontFamily: "Inter", color: "#78350F", fontSize: 12, width: 40, height: 20, x: -60, y: 0 },
      { type: "text", value: "1998", fontFamily: "Inter", color: "#78350F", fontSize: 12, width: 40, height: 20, x: 60, y: 0 },
      { type: "text", value: "COFFEE\nHOUSE", fontFamily: "Oswald", fontWeight: "bold", color: "#451A03", fontSize: 45, lineHeight: 1.1, width: 180, height: 100 }
    ]
  },
  {
    id: "luxury-brand", name: "Luxury Brand", width: 240, height: 100,
    elements: [
      { type: "text", value: "VALENTINE", fontFamily: "Cinzel", color: "#111111", fontSize: 35, letterSpacing: 4, width: 240, height: 50, y: -15 },
      { type: "text", value: "PARIS", fontFamily: "Montserrat", color: "#6B7280", fontSize: 14, letterSpacing: 8, width: 240, height: 30, y: 25 }
    ]
  },
  {
    id: "vintage-badge", name: "Vintage", width: 180, height: 120,
    elements: [
      { type: "text", value: "PREMIUM\nQUALITY", fontFamily: "Abril Fatface", color: "#F59E0B", fontSize: 35, lineHeight: 1.0, textShadow: "1px 1px 0 #78350F", width: 180, height: 80 }
    ]
  },
  {
    id: "beauty-salon", name: "Beauty Salon", width: 220, height: 100,
    elements: [
      { type: "text", value: "Glow", fontFamily: "Alex Brush", color: "#F472B6", fontSize: 65, width: 220, height: 70, y: -10 },
      { type: "text", value: "STUDIO", fontFamily: "Montserrat", color: "#111111", fontSize: 16, letterSpacing: 6, width: 220, height: 30, y: 35 }
    ]
  },
  {
    id: "art-gallery", name: "Art Gallery", width: 200, height: 140,
    elements: [
      { type: "text", value: "A\nR\nT", fontFamily: "Bodoni MT", color: "#111111", fontSize: 50, lineHeight: 0.9, width: 80, height: 140, x: -60 },
      { type: "text", value: "GALLERY", fontFamily: "Inter", color: "#111111", fontSize: 16, letterSpacing: 6, width: 120, height: 30, x: 40, y: 0 }
    ]
  },
  {
    id: "photography", name: "Photography", width: 240, height: 80,
    elements: [
      { type: "text", value: "J.DOE", fontFamily: "Montserrat", fontWeight: "bold", color: "#111111", fontSize: 30, width: 120, height: 40, x: -60, y: 0 },
      { type: "text", value: "PHOTOGRAPHY", fontFamily: "Lato", color: "#6B7280", fontSize: 12, letterSpacing: 4, width: 120, height: 40, x: 60, y: 5 }
    ]
  },
  {
    id: "floral", name: "Floral", width: 200, height: 100,
    elements: [
      { type: "text", value: "Botanic", fontFamily: "Playfair Display", fontStyle: "italic", color: "#15803D", fontSize: 45, width: 200, height: 60, y: -15 },
      { type: "text", value: "GARDENS", fontFamily: "Montserrat", color: "#4ADE80", fontSize: 14, letterSpacing: 4, width: 200, height: 30, y: 25 }
    ]
  },

  // 41-50: Playful & Trendy
  {
    id: "bubblegum", name: "Bubblegum", width: 220, height: 90,
    elements: [
      { type: "text", value: "BUBBLE", fontFamily: "Fredoka One", color: "#FBCFE8", WebkitTextStroke: "2px #EC4899", fontSize: 60, width: 220, height: 90 }
    ]
  },
  {
    id: "varsity", name: "Varsity", width: 240, height: 80,
    elements: [
      { type: "text", value: "COLLEGE", fontFamily: "Graduate", color: "#1D4ED8", WebkitTextStroke: "1px #FFFFFF", textShadow: "3px 3px 0 #1E3A5F", fontSize: 50, letterSpacing: 2, width: 240, height: 80 }
    ]
  },
  {
    id: "skater", name: "Skater", width: 200, height: 120,
    elements: [
      { type: "text", value: "SKATE\nOR DIE", fontFamily: "Permanent Marker", color: "#000000", fontSize: 55, lineHeight: 1.1, textAlign: "left", width: 200, height: 120 }
    ]
  },
  {
    id: "y2k", name: "Y2K Aesthetic", width: 220, height: 80,
    elements: [
      { type: "text", value: "Y2K Baby", fontFamily: "Comic Sans MS", color: "#C084FC", fontSize: 45, textShadow: "2px 2px 0 #FFFFFF, 4px 4px 0 #A855F7", width: 220, height: 80 }
    ]
  },
  {
    id: "glitch", name: "Glitch", width: 240, height: 80,
    elements: [
      { type: "text", value: "ERROR 404", fontFamily: "Courier New", fontWeight: "bold", color: "#FFFFFF", fontSize: 45, textShadow: "2px 0 0 #FF0000, -2px 0 0 #0000FF", width: 240, height: 80 }
    ]
  },
  {
    id: "sunset", name: "Sunset", width: 200, height: 100,
    elements: [
      { type: "text", value: "SUN", fontFamily: "Oswald", fontWeight: "bold", color: "#F59E0B", fontSize: 60, width: 200, height: 70, y: -15 },
      { type: "text", value: "SET", fontFamily: "Oswald", fontWeight: "bold", color: "#EF4444", fontSize: 60, width: 200, height: 70, y: 35 }
    ]
  },
  {
    id: "pop-art", name: "Pop Art", width: 200, height: 90,
    elements: [
      { type: "text", value: "POP!", fontFamily: "Bangers", color: "#FACC15", WebkitTextStroke: "2px #000000", textShadow: "4px 4px 0 #000", fontSize: 70, width: 200, height: 90 }
    ]
  },
  {
    id: "groovy", name: "Groovy", width: 220, height: 100,
    elements: [
      { type: "text", value: "Groovy", fontFamily: "Pacifico", color: "#F97316", textShadow: "3px 3px 0 #FACC15", fontSize: 65, width: 220, height: 100 }
    ]
  },
  {
    id: "3d-block", name: "3D Block", width: 220, height: 80,
    elements: [
      { type: "text", value: "BLOCK", fontFamily: "Impact", color: "#E5E7EB", textShadow: "1px 1px #D1D5DB, 2px 2px #9CA3AF, 3px 3px #6B7280, 4px 4px #4B5563, 5px 5px #374151", fontSize: 60, width: 220, height: 80 }
    ]
  },
  {
    id: "cutout", name: "Cutout", width: 240, height: 90,
    elements: [
      { type: "text", value: "MAGAZINE", fontFamily: "Arial Black", color: "#FFFFFF", backgroundColor: "#000000", fontSize: 45, padding: "5px 15px", rotation: -2, width: 240, height: 90 }
    ]
  },
  // 51-65: Anime, Vintage & Literature
  {
    id: "anime-action", name: "Shonen Action", width: 220, height: 90,
    elements: [
      { type: "text", value: "HERO", fontFamily: "Bangers", color: "#FFFFFF", WebkitTextStroke: "2px #EF4444", textShadow: "4px 4px 0px #000000", fontSize: 80, width: 220, height: 90, rotation: -5 }
    ]
  },
  {
    id: "mecha-unit", name: "Mecha Unit", width: 200, height: 100,
    elements: [
      { type: "text", value: "UNIT-01", fontFamily: "Impact", fontStyle: "italic", color: "#8B5CF6", WebkitTextStroke: "1px #10B981", fontSize: 50, letterSpacing: 4, width: 200, height: 60, y: -10 },
      { type: "text", value: "WARNING", fontFamily: "Courier New", color: "#EF4444", backgroundColor: "#000000", fontSize: 16, width: 100, height: 25, y: 30 }
    ]
  },
  {
    id: "tokyo-vertical", name: "Tokyo Drift", width: 80, height: 200,
    elements: [
      { type: "text", value: "T\nO\nK\nY\nO", fontFamily: "Oswald", fontWeight: "bold", color: "#111111", fontSize: 50, lineHeight: 0.9, width: 80, height: 200 }
    ]
  },
  {
    id: "kawaii-pop", name: "Kawaii Pop", width: 200, height: 80,
    elements: [
      { type: "text", value: "Kawaii~", fontFamily: "Pacifico", color: "#FBCFE8", textShadow: "2px 2px 0px #EC4899", fontSize: 50, width: 200, height: 80 }
    ]
  },
  {
    id: "manga-title", name: "Manga Title", width: 220, height: 120,
    elements: [
      { type: "text", value: "NINJA", fontFamily: "Bebas Neue", color: "#000000", fontSize: 70, width: 220, height: 70, y: -15 },
      { type: "text", value: "CHRONICLES", fontFamily: "Arial", fontWeight: "bold", color: "#FFFFFF", backgroundColor: "#000000", padding: "4px 8px", fontSize: 16, letterSpacing: 8, width: 220, height: 30, y: 30 }
    ]
  },
  {
    id: "chapter-one", name: "Chapter Title", width: 200, height: 120,
    elements: [
      { type: "text", value: "Chapter I.", fontFamily: "Playfair Display", fontStyle: "italic", color: "#4B5563", fontSize: 24, width: 200, height: 30, y: -25 },
      { type: "text", value: "THE BEGINNING", fontFamily: "Playfair Display", fontWeight: "bold", color: "#111111", fontSize: 35, width: 200, height: 80, y: 20 }
    ]
  },
  {
    id: "vintage-typewriter", name: "Typewriter", width: 240, height: 100,
    elements: [
      { type: "text", value: "It was a dark\nand stormy night...", fontFamily: "Courier New", color: "#374151", fontSize: 22, lineHeight: 1.5, textAlign: "left", width: 240, height: 100 }
    ]
  },
  {
    id: "old-book", name: "Old Book", width: 220, height: 160,
    elements: [
      { type: "text", value: "THE", fontFamily: "Playfair Display", color: "#78350F", fontSize: 20, letterSpacing: 6, width: 220, height: 30, y: -45 },
      { type: "text", value: "ODYSSEY", fontFamily: "Playfair Display", fontWeight: "bold", color: "#451A03", fontSize: 50, width: 220, height: 60, y: 0 },
      { type: "text", value: "HOMER", fontFamily: "Georgia", color: "#78350F", fontSize: 18, width: 220, height: 30, y: 50 }
    ]
  },
  {
    id: "poetic", name: "Poetic", width: 220, height: 120,
    elements: [
      { type: "text", value: "Wandering in", fontFamily: "Georgia", fontStyle: "italic", color: "#4B5563", fontSize: 20, width: 220, height: 30, y: -20 },
      { type: "text", value: "Eternity", fontFamily: "Alex Brush", color: "#1F2937", fontSize: 60, width: 220, height: 70, y: 20 }
    ]
  },
  {
    id: "vintage-label", name: "Vintage Label", width: 200, height: 100,
    elements: [
      { type: "text", value: "PREMIUM", fontFamily: "Oswald", color: "#B45309", fontSize: 16, letterSpacing: 4, width: 200, height: 25, y: -25 },
      { type: "text", value: "QUALITY", fontFamily: "Playfair Display", fontWeight: "bold", color: "#111111", fontSize: 40, width: 200, height: 50, y: 15 }
    ]
  },
  {
    id: "library-stamp", name: "Library Stamp", width: 180, height: 100,
    elements: [
      { type: "text", value: "DUE DATE", fontFamily: "Courier New", fontWeight: "bold", color: "#4B5563", fontSize: 18, borderBottom: "2px solid #4B5563", padding: "0 0 5px 0", width: 180, height: 30, y: -20 },
      { type: "text", value: "OCT 24 1998", fontFamily: "Courier New", color: "#2563EB", fontSize: 24, textShadow: "0 0 1px #2563EB", width: 180, height: 40, y: 20 }
    ]
  },
  {
    id: "fairy-tale", name: "Fairy Tale", width: 240, height: 100,
    elements: [
      { type: "text", value: "Once Upon", fontFamily: "Georgia", fontStyle: "italic", color: "#6B7280", fontSize: 24, width: 240, height: 30, y: -25, textAlign: "left" },
      { type: "text", value: "A Time...", fontFamily: "Playfair Display", color: "#111111", fontSize: 45, width: 240, height: 60, y: 15, textAlign: "left" }
    ]
  },
  {
    id: "aesthetic-quote", name: "Aesthetic Quote", width: 200, height: 120,
    elements: [
      { type: "text", value: "\"Art is the lie\nthat enables us\nto realize the truth.\"", fontFamily: "Inter", fontStyle: "italic", color: "#111111", fontSize: 16, lineHeight: 1.4, textAlign: "left", borderLeft: "3px solid #111111", padding: "0 0 0 15px", width: 200, height: 120 }
    ]
  },
  {
    id: "retro-1970", name: "Retro 1970", width: 200, height: 80,
    elements: [
      { type: "text", value: "VINTAGE", fontFamily: "Playfair Display", fontWeight: "bold", fontStyle: "italic", color: "#B45309", textShadow: "2px 2px 0px #FDE68A", fontSize: 50, width: 200, height: 80 }
    ]
  },
  {
    id: "detective-novel", name: "Detective Novel", width: 220, height: 120,
    elements: [
      { type: "text", value: "A MYSTERY BY", fontFamily: "Montserrat", fontWeight: "bold", color: "#4B5563", fontSize: 12, letterSpacing: 2, width: 220, height: 20, y: -30 },
      { type: "text", value: "THE CROW", fontFamily: "Impact", color: "#000000", fontSize: 55, letterSpacing: 2, width: 220, height: 60, y: 10 }
    ]
  }
];
