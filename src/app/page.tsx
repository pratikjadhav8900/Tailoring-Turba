import Navbar from "@/components/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import HowItWorks from "@/components/landing/HowItWorks";
import ProductsSection from "@/components/landing/ProductsSection";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <HowItWorks />
        <ProductsSection />
        
        {/* Simple clean footer inside page */}
        <footer style={{ background: "white", padding: "60px 24px", borderTop: "1px solid var(--border-light)", textAlign: "center" }}>
          <div className="container">
            <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-main)", marginBottom: 16 }}>
              Tailoring Turba
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", maxWidth: 400, margin: "0 auto 32px" }}>
              The modern way to order completely custom bulk apparel for your team, company, or brand.
            </p>
            <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", borderTop: "1px solid var(--border-light)", paddingTop: 24 }}>
              © {new Date().getFullYear()} Tailoring Turba. Made in Pune.
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}
