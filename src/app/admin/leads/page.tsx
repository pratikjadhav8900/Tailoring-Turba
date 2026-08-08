export const dynamic = 'force-dynamic';
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import styles from "../page.module.css";
import LeadsClient from "./LeadsClient";

export default async function AdminLeadsPage() {
  const session = await auth();
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
    return <div>Unauthorized</div>;
  }

  // Fetch only PENDING orders (leads / abandoned checkouts)
  const leads = await prisma.order.findMany({
    where: {
      status: "PENDING"
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          phone: true,
        }
      },
      items: {
        include: {
          product: true
        }
      },
      shippingAddress: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Abandoned Checkouts (Leads)</h1>
          <p className={styles.sub}>Track customer checkout attempts, view contact details, and follow up to recover sales.</p>
        </div>
      </div>

      <LeadsClient initialLeads={leads} />
    </div>
  );
}
