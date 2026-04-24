import Link from "next/link";
import Image from "next/image";

export default function ProductsSection() {
  const products = [
    { 
      name: "Custom Polo Shirts", 
      price: "₹385", 
      type: "Premium Cotton Blend", 
      badge: "Best Seller",
      image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80"
    },
    { 
      name: "Team Jerseys", 
      price: "₹450", 
      type: "Sublimated Sportswear", 
      badge: "Premium",
      image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600&q=80"
    },
    { 
      name: "Corporate T-Shirts", 
      price: "₹299", 
      type: "Combed Cotton", 
      badge: "",
      image: "https://images.unsplash.com/photo-1584916201218-f4242ceb4809?w=600&q=80"
    },
    { 
      name: "Custom Hoodies", 
      price: "₹550", 
      type: "Fleece Fabric", 
      badge: "Top Rated",
      image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&q=80"
    },
  ];

  return (
    <section className="container" style={{ padding: "80px 24px", background: "#0a0a0a" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 40, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h2 style={{ fontSize: "2.5rem", fontWeight: 800, color: "#ffffff", marginBottom: 8 }}>
            Our Base Products
          </h2>
          <p style={{ color: "#a0a0a0", fontSize: "1rem" }}>
            Choose from our manufacturing-ready silhouettes to start your design.
          </p>
        </div>
        <Link href="/products" className="btn-secondary">
          View All Products →
        </Link>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
        {products.map((p, i) => (
          <div key={i} style={{ 
              background: "#1a1a1a", 
              border: "1px solid #333333",
              borderRadius: 12, 
              padding: 20, 
              transition: "transform 0.2s",
              cursor: "pointer"
            }}>
            <div style={{ 
              background: "#2a2a2a", 
              borderRadius: 8, 
              height: 320, 
              position: "relative",
              overflow: "hidden",
              marginBottom: 20
            }}>
              <Image 
                src={p.image} 
                alt={p.name} 
                fill
                style={{ objectFit: "cover" }}
              />
              {p.badge && (
                <span style={{ position: "absolute", top: 12, right: 12, background: "#F59E0B", color: "white", fontSize: "0.7rem", padding: "4px 8px", borderRadius: 4, fontWeight: 700, textTransform: "uppercase" }}>
                  {p.badge}
                </span>
              )}
            </div>
            
            <div style={{ color: "#a0a0a0", fontSize: "0.8rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
              {p.type}
            </div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#ffffff", marginBottom: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {p.name}
            </h3>
            
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#F59E0B" }}>{p.price}</div>
              <Link href="/customizer" style={{ fontSize: "0.85rem", color: "#ffffff", fontWeight: 600, textDecoration: "underline" }}>
                Customize Now
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
