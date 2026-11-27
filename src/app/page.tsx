import HeroSlider from "@/components/landing/HeroSlider";
import StatsStrip from "@/components/landing/StatsStrip";
import ClientLogos from "@/components/landing/ClientLogos";
import ProductRailShowcase from "@/components/landing/ProductRailShowcase";
import ProductCoverflow from "@/components/landing/ProductCoverflow";
import CategoryCarousel from "@/components/landing/CategoryCarousel";
import FeaturesGrid from "@/components/landing/FeaturesGrid";
import TargetAudienceGrid from "@/components/landing/TargetAudienceGrid";
import CustomizationEducation from "@/components/landing/CustomizationEducation";
import AppShowcase from "@/components/landing/AppShowcase";

import CategoryHoverTrail from "@/components/landing/CategoryHoverTrail";

export default function Home() {
  return (
    <>
      {/* 1. Full-screen hero slider */}
      <HeroSlider />

      {/* 2. Animated stats — social proof immediately after the hero */}
      <StatsStrip />

      {/* 3. Brand wall — trusted partners */}
      <ClientLogos />

      {/* 4. Editorial welcome / brand story — now an interactive product rail */}
      <ProductRailShowcase />

      {/* 4.5 Product coverflow — studio photography of the range (draggable 3D gallery) */}
      <ProductCoverflow />

      {/* 5. Category carousel */}
      <CategoryCarousel />

      {/* 5.5 Interactive Editorial Category Index (CategoryHoverTrail) */}
      <CategoryHoverTrail />

      {/* 6. Features / USPs */}
      <FeaturesGrid />

      {/* 7. Who we serve — commented out for now */}
      {/* <TargetAudienceGrid /> */}

      {/* 7.5 Customization Printing Education Section */}
      <CustomizationEducation />

      {/* 8. App showcase */}
      <AppShowcase />
    </>
  );
}
