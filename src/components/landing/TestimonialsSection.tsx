import styles from "./TestimonialsSection.module.css";

const testimonials = [
  {
    name: "Rahul Sharma",
    role: "Football Coach, Pune FC",
    text: "Tailoring Turba delivered our entire team kit in just 6 days. The sublimation print is vibrant and the fabric quality is top-notch. Highly recommend for any sports team!",
    avatar: "RS",
    rating: 5,
  },
  {
    name: "Priya Mehta",
    role: "HR Manager, TechCorp India",
    text: "Ordered 200 corporate polos with our logo. Perfect embroidery, on-time delivery, and the GST invoice made our accounts team very happy.",
    avatar: "PM",
    rating: 5,
  },
  {
    name: "Arjun Kulkarni",
    role: "Cricket Academy Owner",
    text: "The online customizer is brilliant — I could see exactly how the kit would look before ordering. Bulk pricing is very competitive for our academy.",
    avatar: "AK",
    rating: 5,
  },
];

export default function TestimonialsSection() {
  return (
    <section className={styles.section} id="testimonials">
      <div className="container">
        <div className={styles.header}>
          <div className="section-badge">💬 Testimonials</div>
          <h2 className={styles.title}>What Our Clients Say</h2>
        </div>
        <div className={styles.grid}>
          {testimonials.map((t, i) => (
            <div key={i} className={`${styles.card} glass-card`}>
              <div className={styles.stars}>{"⭐".repeat(t.rating)}</div>
              <p className={styles.quote}>&ldquo;{t.text}&rdquo;</p>
              <div className={styles.author}>
                <div className={styles.avatar}>{t.avatar}</div>
                <div>
                  <div className={styles.name}>{t.name}</div>
                  <div className={styles.role}>{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
