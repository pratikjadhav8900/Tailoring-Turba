export const dynamic = 'force-dynamic';
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import styles from "./page.module.css";
import { CalendarCheck, MapPin, Clock } from "lucide-react";

import Image from "next/image";

export default async function BookingsPage() {
  const session = await auth();
  const userId = session?.user?.id as string;

  const bookings = await prisma.booking.findMany({
    where: { userId },
    orderBy: { date: "asc" },
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
            <h1 className={styles.title}>Bookings</h1>
            <p className={styles.sub}>Manage your showroom appointments and consultations.</p>
          </div>
          <Link href="/booking" className={styles.primaryBtn}>
            <CalendarCheck size={18} /> Schedule Visit
          </Link>
        </div>
      </div>

      <div className={styles.mainContent}>
        {bookings.length === 0 ? (
          <div className={styles.emptyGlass}>
            <div className={styles.emptyIconBox}>
              <CalendarCheck size={32} />
            </div>
            <h2>No upcoming visits</h2>
            <p>You haven't scheduled any showroom visits. Experience our premium fabrics in person.</p>
            <Link href="/booking" className={styles.primaryBtn} style={{ marginTop: '16px' }}>
              Book an Appointment
            </Link>
          </div>
        ) : (
        <div className={styles.list}>
          {bookings.map(booking => {
            const isPast = new Date(booking.date) < new Date();
            return (
              <div key={booking.id} className={`${styles.card} ${isPast ? styles.past : ""}`}>
                <div className={styles.cardHeader}>
                  <div className={styles.dateInfo}>
                    <div className={styles.day}>{new Date(booking.date).getDate()}</div>
                    <div className={styles.monthYear}>
                      <span className={styles.month}>{new Date(booking.date).toLocaleDateString("en-IN", { month: "short" }).toUpperCase()}</span>
                      <span className={styles.year}>{new Date(booking.date).getFullYear()}</span>
                    </div>
                  </div>
                  <div className={`${styles.badge} ${styles[`badge-${booking.status.toLowerCase()}`]}`}>
                    {booking.status}
                  </div>
                </div>
                
                <div className={styles.details}>
                  <div className={styles.detailItem}>
                    <Clock size={16} />
                    <span>{booking.timeSlot}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <MapPin size={16} />
                    <span>Pune Showroom</span>
                  </div>
                </div>

                {booking.notes && (
                  <div className={styles.notes}>
                    <strong>Notes:</strong> {booking.notes}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        )}
      </div>
    </div>
  );
}

