import styles from "./Footer.module.css";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className={styles.footer} id="footer">
      <div className="container">
        <div className={styles.top}>
          <div className={styles.brand}>
            <div className={styles.logo}><span>K</span>raftX</div>
            <p className={styles.tagline}>
              Premium print-on-demand textiles for sports teams, corporates, and businesses across India.
            </p>
            <div className={styles.socials}>
              <a href="#" aria-label="Instagram">📸</a>
              <a href="#" aria-label="WhatsApp">💬</a>
              <a href="#" aria-label="LinkedIn">💼</a>
            </div>
          </div>

          <div className={styles.col}>
            <h4>Products</h4>
            <Link href="#">Sports Jerseys</Link>
            <Link href="#">Corporate Polos</Link>
            <Link href="#">Cricket Kits</Link>
            <Link href="#">Custom Hoodies</Link>
          </div>

          <div className={styles.col}>
            <h4>Company</h4>
            <Link href="#">About Us</Link>
            <Link href="/booking">Book Appointment</Link>
            <Link href="#">Bulk Inquiry</Link>
            <Link href="#">Careers</Link>
          </div>

          <div className={styles.col}>
            <h4>Contact</h4>
            <p>📍 321/1 Pandit Jawaharlal Nehru Marg Pune 411042, Sanjay Departments, Pune, Maharashtra 411042, IN</p>
            <p>📞 07942669612</p>
            <p>📧 tailoringturba@gmail.com</p>
            <p>🕐 Mon–Sat, 10AM–7PM</p>
          </div>
        </div>

        <div className={styles.bottom}>
          <p>© {new Date().getFullYear()} Tailoring Turba. All rights reserved.</p>
          <div className={styles.bottomLinks}>
            <Link href="#">Privacy Policy</Link>
            <Link href="#">Terms of Service</Link>
            <Link href="#">Refund Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
