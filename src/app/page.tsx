import HeroSlider from "@/components/landing/HeroSlider";
import StatsStrip from "@/components/landing/StatsStrip";
import ClientLogos from "@/components/landing/ClientLogos";
import EditorialWelcome from "@/components/landing/EditorialWelcome";
import CategoryCarousel from "@/components/landing/CategoryCarousel";
import FeaturesGrid from "@/components/landing/FeaturesGrid";
import TargetAudienceGrid from "@/components/landing/TargetAudienceGrid";
import CustomizationEducation from "@/components/landing/CustomizationEducation";
import AppShowcase from "@/components/landing/AppShowcase";

// Preserved for future reuse — temporarily commented out
// import CategoryHoverTrail from "@/components/landing/CategoryHoverTrail";

export default function Home() {
  return (
    <>
      {/* 1. Full-screen hero slider */}
      <HeroSlider />

      {/* 2. Animated stats — social proof immediately after the hero */}
      <StatsStrip />

      {/* 3. Brand wall — trusted partners */}
      <ClientLogos />

      {/* 4. Editorial welcome / brand story */}
      <EditorialWelcome />

      {/* 5. Category carousel */}
      <CategoryCarousel />

      {/* Preserved interaction section for future reuse */}
      {/* <CategoryHoverTrail /> */}

      {/* 6. Features / USPs */}
      <FeaturesGrid />

      {/* 7. Who we serve */}
      <TargetAudienceGrid />

      {/* 7.5 Customization Printing Education Section */}
      <CustomizationEducation />

      {/* 8. App showcase */}
      <AppShowcase />
    </>
  );
}
