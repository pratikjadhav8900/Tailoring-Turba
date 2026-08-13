import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Cookie & Privacy Policy",
  description: "Learn how Tailoring Turba uses cookies and handles your personal data.",
};

const cookieTypes = [
  {
    name: "Strictly Necessary",
    desc: "Essential for the website to function. Set in response to your actions such as setting privacy preferences or logging in. Cannot be switched off.",
  },
  {
    name: "Analytics & Performance",
    desc: "Allow us to count visits and traffic sources to measure and improve site performance. All information is aggregated and anonymous.",
  },
  {
    name: "Marketing & Personalisation",
    desc: "Set by advertising partners to build a profile of your interests and show relevant adverts on other sites.",
  },
];

const sections = [
  {
    title: "What Are Cookies?",
    body: "Cookies are small text files placed on your device when you visit a website. They are widely used to make websites work more efficiently and to provide information to site owners. Cookies do not damage your device and do not contain personally identifiable information in themselves.",
  },
  {
    title: "How We Use Cookies",
    body: "Tailoring Turba uses cookies and similar tracking technologies to ensure the website functions correctly, remember your preferences and settings across visits, analyse how visitors use our website to improve performance, and deliver personalised content and relevant advertising in partnership with trusted third parties.",
  },
  {
    title: "Managing Your Preferences",
    body: `You can manage your cookie preferences at any time by clicking "Cookie settings" in the banner at the bottom of any page. You may withdraw your consent or change your selections at any time.\n\nYou can also control cookies through your browser settings. Please note that disabling certain cookies may affect the functionality of the website.`,
  },
  {
    title: "Personal Data We Collect",
    body: "When you use our website or services, we may collect your name, email address and contact details when you register or enquire, order and transaction history, device and browser information for analytics, and IP address and approximate location. We collect and process this data in accordance with applicable data protection laws, including the Information Technology Act, 2000 (India) and GDPR where applicable.",
  },
  {
    title: "How We Use Your Data",
    body: "We use your personal data to process and fulfil your orders, communicate with you about your account or enquiries, send promotional materials where you have given consent, improve our products and services, and comply with legal obligations. We never sell your personal data to third parties.",
  },
  {
    title: "Data Retention",
    body: "We retain your personal data only for as long as necessary to fulfil the purposes for which it was collected, or as required by applicable law. Order records are typically retained for 7 years for accounting and legal purposes.",
  },
  {
    title: "Your Rights",
    body: "You have the right to access the personal data we hold about you, request correction of inaccurate data, request deletion of your data (subject to legal obligations), withdraw consent at any time where processing is based on consent, and lodge a complaint with a relevant data protection authority. To exercise any of these rights, please contact us at privacy@tailoringturba.com.",
  },
  {
    title: "Third-Party Services",
    body: "Our website may use third-party services including Google Analytics, Meta Pixel, and Vercel Analytics. These services may set their own cookies and collect data in accordance with their own privacy policies. We encourage you to review their policies separately.",
  },
  {
    title: "Changes to This Policy",
    body: "We may update this Cookie & Privacy Policy from time to time. Any changes will be posted on this page with an updated revision date. We encourage you to review this page periodically.",
  },
];

export default function PrivacyPolicyPage() {
  return (
    <main style={{ minHeight: "100vh", background: "#fff", paddingTop: "80px", fontFamily: "var(--font-sans, 'Outfit', sans-serif)" }}>

      {/* Hero */}
      <div style={{
        background: "var(--tth-black, #111)",
        color: "#fff",
        padding: "80px 32px 64px",
        textAlign: "center",
      }}>
        <p style={{
          fontFamily: "var(--font-sans, 'Outfit', sans-serif)",
          fontSize: "0.7rem",
          letterSpacing: "0.22em",
          color: "rgba(255,255,255,0.45)",
          textTransform: "uppercase",
          margin: "0 0 20px",
        }}>
          Legal
        </p>
        <h1 style={{
          fontFamily: "var(--font-serif, 'Playfair Display', serif)",
          fontSize: "clamp(2.2rem, 5vw, 3.5rem)",
          fontWeight: 400,
          margin: "0 0 20px",
          lineHeight: 1.1,
          letterSpacing: "-0.02em",
        }}>
          Cookie &amp; Privacy Policy
        </h1>
        <p style={{
          fontFamily: "var(--font-sans, 'Outfit', sans-serif)",
          fontSize: "0.75rem",
          color: "rgba(255,255,255,0.35)",
          margin: 0,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
        }}>
          Last updated: August 2026
        </p>
      </div>

      {/* Intro */}
      <div style={{ maxWidth: "860px", margin: "0 auto", padding: "56px 32px 0" }}>
        <p style={{
          fontFamily: "var(--font-sans, 'Outfit', sans-serif)",
          fontSize: "1rem",
          lineHeight: 1.85,
          color: "#555",
          borderLeft: "3px solid var(--tth-olive-dark, #4a5e3a)",
          paddingLeft: "20px",
          margin: 0,
        }}>
          This policy explains how <strong style={{ color: "#111", fontWeight: 600 }}>Tailoring Turba</strong> collects,
          uses, and protects information about you when you visit{" "}
          <a href="https://tailoringturba.com" style={{ color: "var(--tth-olive-dark, #4a5e3a)", textDecoration: "underline", textUnderlineOffset: "3px" }}>
            tailoringturba.com
          </a>
          . By using our website, you agree to the use of cookies as described below.
        </p>
      </div>

      {/* Cookie type cards */}
      <div style={{ maxWidth: "860px", margin: "0 auto", padding: "48px 32px 0" }}>
        <p style={{
          fontFamily: "var(--font-sans, 'Outfit', sans-serif)",
          fontSize: "0.7rem",
          fontWeight: 700,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: "var(--tth-olive-dark, #4a5e3a)",
          margin: "0 0 20px",
        }}>
          Types of Cookies We Use
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
          {cookieTypes.map((c) => (
            <div key={c.name} style={{
              border: "1px solid #e8e8e0",
              borderRadius: "4px",
              padding: "24px",
              background: "#fafaf8",
            }}>
              <p style={{
                fontFamily: "var(--font-serif, 'Playfair Display', serif)",
                fontSize: "1rem",
                fontWeight: 600,
                color: "#111",
                margin: "0 0 10px",
              }}>
                {c.name}
              </p>
              <p style={{ fontSize: "0.82rem", lineHeight: 1.75, color: "#666", margin: 0 }}>
                {c.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Policy sections */}
      <div style={{ maxWidth: "860px", margin: "0 auto", padding: "48px 32px 80px" }}>
        {sections.map((s, i) => (
          <div key={s.title} style={{
            paddingTop: i === 0 ? 0 : "36px",
            marginTop: i === 0 ? 0 : "36px",
            borderTop: i === 0 ? "none" : "1px solid #ebebeb",
          }}>
            <h2 style={{
              fontFamily: "var(--font-serif, 'Playfair Display', serif)",
              fontSize: "1.35rem",
              fontWeight: 400,
              color: "#111",
              margin: "0 0 14px",
              letterSpacing: "-0.01em",
            }}>
              {s.title}
            </h2>
            <p style={{
              fontFamily: "var(--font-sans, 'Outfit', sans-serif)",
              fontSize: "0.88rem",
              lineHeight: 1.85,
              color: "#555",
              margin: 0,
              whiteSpace: "pre-line",
            }}>
              {s.body}
            </p>
          </div>
        ))}

        {/* Contact callout */}
        <div style={{
          marginTop: "48px",
          background: "#f8f9f5",
          border: "1px solid #e0e5d8",
          borderRadius: "4px",
          padding: "28px 32px",
        }}>
          <p style={{
            fontFamily: "var(--font-sans, 'Outfit', sans-serif)",
            fontSize: "0.7rem",
            fontWeight: 700,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "var(--tth-olive-dark, #4a5e3a)",
            margin: "0 0 10px",
          }}>
            Contact Us
          </p>
          <p style={{ fontFamily: "var(--font-serif, 'Playfair Display', serif)", fontSize: "1.15rem", fontWeight: 400, color: "#111", margin: "0 0 8px" }}>
            Questions about this policy?
          </p>
          <p style={{ fontSize: "0.85rem", color: "#666", margin: 0 }}>
            Email us at{" "}
            <a href="mailto:privacy@tailoringturba.com" style={{ color: "var(--tth-olive-dark, #4a5e3a)", textDecoration: "underline" }}>
              privacy@tailoringturba.com
            </a>
          </p>
        </div>

        {/* Return CTA */}
        <div style={{ marginTop: "40px" }}>
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "10px",
              padding: "1rem 2.5rem",
              background: "var(--tth-black, #111)",
              color: "#fff",
              textDecoration: "none",
              fontFamily: "var(--font-sans, 'Outfit', sans-serif)",
              fontWeight: 600,
              fontSize: "0.85rem",
              letterSpacing: "0.05em",
              borderRadius: "4px",
            }}
          >
            ← Return to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
