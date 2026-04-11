import Link from "next/link";
import Image from "next/image";

export default function ProductsSection() {
  const products = [
    { 
      name: "Chromo Gift Set", 
      price: "₹1499", 
      type: "Wallet, Belt, Pen & Keychain", 
      badge: "Premium",
      image: "https://images.unsplash.com/photo-1544816155-12df9643f363?w=600&q=80"
    },
    { 
      name: "Estilo Brown Set", 
      price: "₹1299", 
      type: "Wallet, Keychain, Pen & Cardholder", 
      badge: "Best Seller",
      image: "https://images.unsplash.com/photo-1586281380117-5a60ae2050cc?w=600&q=80"
    },
    { 
      name: "Sip & Stash Duo", 
      price: "₹999", 
      type: "Containers & 1L Bottle", 
      badge: "",
      image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&q=80"
    },
    { 
      name: "Black Elastic Diary", 
      price: "₹599", 
      type: "Metal Pen & A5 Diary", 
      badge: "Top Rated",
      image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&q=80"
    },
  ];

  return (
    <section className="container" style={{ padding: "80px 24px", background: "var(--bg-main)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 40, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h2 style={{ fontSize: "2.5rem", fontWeight: 800, color: "var(--text-main)", marginBottom: 8 }}>
            Our Base Products
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "1rem" }}>
            Choose from our manufacturing-ready silhouettes to start your design.
          </p>
        </div>
        <Link href="/products" className="btn-secondary">
          View All Products →
        </Link>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
        {products.map((p, i) => (
          <div key={i} className="glass-card" style={{ padding: 20, transition: "transform 0.2s" }}>
            <div style={{ 
              background: "#F3F4F6", 
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
                <span style={{ position: "absolute", top: 12, right: 12, background: "var(--accent)", color: "white", fontSize: "0.7rem", padding: "4px 8px", borderRadius: 4, fontWeight: 700, textTransform: "uppercase" }}>
                  {p.badge}
                </span>
              )}
            </div>
            
            <div style={{ color: "var(--text-muted)", fontSize: "0.8rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
              {p.type}
            </div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-main)", marginBottom: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {p.name}
            </h3>
            
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--accent)" }}>{p.price}</div>
              <Link href="/customizer" style={{ fontSize: "0.85rem", color: "var(--text-main)", fontWeight: 600, textDecoration: "underline" }}>
                Customize Now
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
