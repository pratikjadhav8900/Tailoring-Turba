export default function HowItWorks() {
  const steps = [
    {
      num: "01",
      icon: "🎨",
      title: "Customize Your Design",
      desc: "Use our live Polo Visualizer to pick colors, set typography, and personalize every detail of your garment.",
    },
    {
      num: "02",
      icon: "📋",
      title: "Fill Your Roster",
      desc: "Add player names, numbers, and size-wise quantities using our intuitive order sheet — perfect for teams.",
    },
    {
      num: "03",
      icon: "✅",
      title: "Confirm & Pay",
      desc: "Review your order, get a GST invoice, and pay securely via Razorpay. Bulk discounts applied automatically.",
    },
    {
      num: "04",
      icon: "🚚",
      title: "Delivered in 7 Days",
      desc: "Your custom order is produced in our Pune facility and shipped directly to your doorstep within 7 business days.",
    },
  ];

  return (
    <section className="container" style={{ padding: "80px 24px", background: "#0a0a0a" }}>
      <div style={{ textAlign: "center", marginBottom: 60 }}>
        <h2 style={{ fontSize: "2.5rem", fontWeight: 800, color: "#ffffff", marginBottom: 16 }}>
          How to Order with Tailoring Turba
        </h2>
        <p style={{ color: "#a0a0a0", fontSize: "1.1rem", maxWidth: 600, margin: "0 auto" }}>
          From a blank canvas to your custom jersey — in four seamless steps.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 32 }}>
        {steps.map((s, i) => (
          <div key={i} style={{ 
            background: "#1a1a1a", 
            border: "1px solid #333333",
            borderRadius: 12, 
            padding: 32, 
            position: "relative" 
          }}>
            <div style={{ fontSize: "3rem", fontWeight: 900, color: "#333333", marginBottom: 16, lineHeight: 1 }}>
              {s.num}
            </div>
            <div style={{ fontSize: "2rem", marginBottom: 20 }}>{s.icon}</div>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#ffffff", marginBottom: 12 }}>
              {s.title}
            </h3>
            <p style={{ color: "#a0a0a0", fontSize: "0.95rem", lineHeight: 1.6 }}>
              {s.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
