export const dynamic = 'force-dynamic';
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import styles from "./page.module.css";
import { CreditCard, Download } from "lucide-react";
import { ExportCsvButton, InvoiceButton } from "./TransactionActions";

import Image from "next/image";

function displayStatus(tx: { status: string; amountPaid: number; remainingAmount: number }) {
  if (tx.status === "CANCELLED") return { label: "Cancelled", css: "status-cancelled" };
  if (tx.status === "PENDING" || tx.amountPaid <= 0) return { label: "Unpaid", css: "status-pending" };
  if (tx.remainingAmount > 0) return { label: "Partially Paid", css: "status-partial" };
  return { label: "Paid", css: "status-paid" };
}

export default async function TransactionsPage() {
  const session = await auth();
  const userId = session?.user?.id as string;

  const transactions = await prisma.order.findMany({
    where: { userId },
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
            <h1 className={styles.title}>Transactions</h1>
            <p className={styles.sub}>Your financial ledger and billing history.</p>
          </div>
          <ExportCsvButton
            rows={transactions.map((tx) => ({
              id: tx.id,
              orderNumber: tx.orderNumber,
              createdAt: tx.createdAt.toISOString(),
              status: tx.status,
              totalAmount: tx.totalAmount,
              amountPaid: tx.amountPaid ?? 0,
              remainingAmount: tx.remainingAmount ?? 0,
            }))}
            className={styles.primaryBtn}
          >
            <Download size={18} /> Export CSV
          </ExportCsvButton>
        </div>
      </div>

      <div className={styles.mainContent}>
        {transactions.length === 0 ? (
          <div className={styles.emptyGlass}>
            <div className={styles.emptyIconBox}>
              <CreditCard size={32} />
            </div>
            <h2>No transactions yet</h2>
            <p>Your billing history and invoices will appear here once you place an order.</p>
          </div>
        ) : (
        <div className={styles.ledger}>
          <div className={styles.ledgerHeader}>
            <div className={styles.col}>Date</div>
            <div className={styles.col}>Reference ID</div>
            <div className={styles.col}>Status</div>
            <div className={styles.colRight}>Amount</div>
          </div>
          <div className={styles.ledgerBody}>
            {transactions.map(tx => (
              <div key={tx.id} className={styles.row}>
                <div className={styles.col}>
                  <span className={styles.date}>{new Date(tx.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
                  <span className={styles.time}>{new Date(tx.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
                <div className={styles.col}>
                  <Link href={`/dashboard/orders`} className={styles.refLink}>
                    #{tx.id.slice(-8).toUpperCase()}
                  </Link>
                </div>
                <div className={styles.col}>
                  <span className={`${styles.status} ${styles[displayStatus(tx).css]}`}>
                    {displayStatus(tx).label}
                  </span>
                </div>
                <div className={styles.colRight}>
                  <span className={styles.amount}>₹{tx.totalAmount.toLocaleString()}</span>
                  <InvoiceButton orderId={tx.id} orderNumber={tx.orderNumber} className={styles.invoiceBtn} />
                </div>
              </div>
            ))}
          </div>
        </div>
        )}
      </div>
    </div>
  );
}

