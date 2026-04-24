import dynamic from "next/dynamic";
import Navbar from "@/components/Navbar";
import MarqueeTicker from "@/components/landing/MarqueeTicker";
import HeroSlider from "@/components/landing/HeroSlider";
import EditorialWelcome from "@/components/landing/EditorialWelcome";

// Normal imports for Server Components
import CategoryCarousel from "@/components/landing/CategoryCarousel";
import FeaturesGrid from "@/components/landing/FeaturesGrid";
import TargetAudienceGrid from "@/components/landing/TargetAudienceGrid";
import AppShowcase from "@/components/landing/AppShowcase";

export default function Home() {
  const stats = [
    { value: "10,000+", label: "Garments Delivered" },
    { value: "48 hrs", label: "Sample Dispatch" },
    { value: "3 Brands", label: "Magic · Folkswear · TTH" },
    { value: "50+", label: "Colors Available" },
    { value: "5 pcs", label: "Minimum Order" },
  ];

  return (
    <>
      {/* Marquee stays fixed at top */}
      <div style={{ position: "fixed", top: 0, left: 0, width: "100%", zIndex: 1001 }}>
        <MarqueeTicker />
      </div>

      <div style={{ paddingTop: 38 }}>
        <Navbar transparent={true} />
      </div>

      <main style={{ background: "var(--tth-white, #fafaf8)" }}>
        {/* Hero slider — full screen, sits under the transparent nav */}
        <HeroSlider />

        {/* Editorial welcome section */}
        <EditorialWelcome />

        {/* Tabbed category carousel */}
        <CategoryCarousel />

        {/* 8-item circular features grid */}
        <FeaturesGrid />

        {/* Bulk Blank Tees Asymmetrical Grid */}
        <TargetAudienceGrid />

        {/* Product Locator / Close deals 2x faster */}
        <AppShowcase />

        {/* Stats strip */}
        <div style={{
          background: "var(--tth-beige-light, #f2ede6)",
          borderTop: "1px solid var(--tth-beige, #e8e0d4)",
          padding: "56px 24px",
          display: "flex",
          justifyContent: "center",
          gap: "64px",
          flexWrap: "wrap",
          textAlign: "center"
        }}>
          {stats.map((stat) => (
            <div key={stat.label}>
              <div style={{ fontSize: "2rem", fontFamily: "var(--font-serif)", color: "var(--tth-black)", marginBottom: 8 }}>
                {stat.value}
              </div>
              <div style={{ fontSize: "0.85rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--tth-text-muted)" }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
