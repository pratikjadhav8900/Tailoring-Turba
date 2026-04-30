import HeroSlider from "@/components/landing/HeroSlider";
import EditorialWelcome from "@/components/landing/EditorialWelcome";
import CategoryCarousel from "@/components/landing/CategoryCarousel";
import FeaturesGrid from "@/components/landing/FeaturesGrid";
import TargetAudienceGrid from "@/components/landing/TargetAudienceGrid";
import AppShowcase from "@/components/landing/AppShowcase";
import ClientLogos from "@/components/landing/ClientLogos";
import HowItWorks from "@/components/landing/HowItWorks";

export default function Home() {
  const stats = [
    { value: "10,000+", label: "Garments Delivered" },
    { value: "48 hrs", label: "Sample Dispatch" },
    { value: "3 Brands", label: "Magic · Folkswear · Tailoring Turba" },
    { value: "50+", label: "Colors Available" },
    { value: "5 pcs", label: "Minimum Order" },
  ];

  return (
    <>
      <HeroSlider />
      <EditorialWelcome />
      <ClientLogos />
      <CategoryCarousel />
      <FeaturesGrid />
      <HowItWorks />
      <TargetAudienceGrid />
      <AppShowcase />

      <div style={{
        background: "var(--tth-beige-light, #f2ede6)",
        borderTop: "1px solid var(--tth-beige, #e8e0d4)",
        padding: "56px 24px",
        display: "flex",
        justifyContent: "center",
        gap: "64px",
        flexWrap: "wrap",
        textAlign: "center",
        margin: 0 // Ensure no stray margins
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
    </>
  );
}
