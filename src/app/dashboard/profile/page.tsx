import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Image from "next/image";
import styles from "./page.module.css";
import { User, Building2, Phone, Mail } from "lucide-react";

export default async function ProfilePage() {
  const session = await auth();
  const userId = session?.user?.id as string;

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  return (
    <div className={styles.page}>
      
      {/* Premium Hero Header */}
      <div className={styles.heroHeader}>
        <div className={styles.heroBg}>
          <Image 
            src="https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=2000"
            alt="Tailoring Background"
            fill
            priority
          />
        </div>
        <div className={styles.heroOverlay}></div>
        <div className={styles.heroContent}>
          <div>
            <h1 className={styles.title}>Profile Settings</h1>
            <p className={styles.sub}>Manage your personal information and B2B details.</p>
          </div>
          <button className={styles.primaryBtn}>Save Changes</button>
        </div>
      </div>

      <div className={styles.mainContent}>
        
        {/* Split Layout: Personal Info */}
        <div className={styles.splitLayout}>
          <div className={styles.splitLeft}>
            <h2>Personal Information</h2>
            <p>Update your name, phone number, and email address. This information will be used for your tailoring appointments and orders.</p>
          </div>
          <div className={styles.splitRight}>
            <div className={styles.card}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Full Name</label>
                  <input type="text" defaultValue={user?.name || ""} placeholder="John Doe" className={styles.input} />
                </div>
                <div className={styles.formGroup}>
                  <label>Email Address</label>
                  <div className={styles.inputWrapper}>
                    <Mail size={16} className={styles.inputIcon} />
                    <input type="email" defaultValue={user?.email || ""} readOnly className={`${styles.input} ${styles.readOnly}`} />
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label>Phone Number</label>
                  <div className={styles.inputWrapper}>
                    <Phone size={16} className={styles.inputIcon} />
                    <input type="tel" defaultValue={user?.phone || ""} placeholder="+91 00000 00000" className={styles.input} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.divider}></div>

        {/* Split Layout: B2B Info */}
        <div className={styles.splitLayout}>
          <div className={styles.splitLeft}>
            <h2>Company Details (B2B)</h2>
            <p>Manage your business credentials for wholesale manufacturing. A valid GST number is required for B2B pricing.</p>
            
            {user?.isB2BApproved ? (
              <div className={styles.statusBannerSuccess}>
                Your B2B account is approved. You have access to wholesale pricing.
              </div>
            ) : (
              <div className={styles.statusBannerPending}>
                Your B2B status is pending approval. Our team will verify your GST details.
              </div>
            )}
          </div>
          <div className={styles.splitRight}>
            <div className={styles.card}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Company Name</label>
                  <input type="text" defaultValue={user?.companyName || ""} placeholder="Your Company Ltd." className={styles.input} />
                </div>
                <div className={styles.formGroup}>
                  <label>GST Number</label>
                  <input type="text" defaultValue={user?.gstNumber || ""} placeholder="22AAAAA0000A1Z5" className={styles.input} />
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
