export const dynamic = 'force-dynamic';
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";
import styles from "./page.module.css";
import { Paintbrush, ArrowRight } from "lucide-react";

export default async function DesignsPage() {
  const session = await auth();
  const userId = session?.user?.id as string;

  const designs = await prisma.design.findMany({
    where: { userId },
    include: { product: true },
    orderBy: { createdAt: "desc" },
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
            <h1 className={styles.title}>My Designs</h1>
            <p className={styles.sub}>Manage and order from your custom apparel portfolio.</p>
          </div>
          <Link href="/customizer" className={styles.primaryBtn}>
            <Paintbrush size={18} /> Create New
          </Link>
        </div>
      </div>

      <div className={styles.mainContent}>
        {designs.length === 0 ? (
          <div className={styles.emptyGlass}>
            <div className={styles.emptyIconBox}>
              <Paintbrush size={32} />
            </div>
            <h2>No designs yet</h2>
            <p>You haven't created any custom apparel yet. Start building your portfolio today.</p>
            <Link href="/customizer" className={styles.primaryBtn} style={{ marginTop: '16px' }}>
              Open Customizer
            </Link>
          </div>
        ) : (
        <div className={styles.grid}>
          {designs.map(design => (
            <div key={design.id} className={styles.card}>
              <div className={styles.imageWrapper}>
                {design.imageUrl ? (
                  <Image src={design.imageUrl} alt={design.name} fill style={{ objectFit: 'contain' }} />
                ) : (
                  <div className={styles.placeholder}>No Image</div>
                )}
              </div>
              <div className={styles.content}>
                <h3 className={styles.name}>{design.name}</h3>
                <div className={styles.meta}>
                  <span>{design.product?.name || "Custom Apparel"}</span>
                  <span>{new Date(design.createdAt).toLocaleDateString()}</span>
                </div>
                <div className={styles.actions}>
                  <Link href={`/customizer`} className={styles.actionBtn}>
                    Edit Design
                  </Link>
                  <Link href={`/cart`} className={styles.actionBtnPrimary}>
                    Order Now <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
        )}
      </div>
    </div>
  );
}

