export const dynamic = 'force-dynamic';
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import styles from "../page.module.css";
import { CreditCard, ArrowUpRight, ArrowDownLeft } from "lucide-react";

export default async function AdminTransactionsPage() {
  const session = await auth();
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
    return <div>Unauthorized</div>;
  }

  // Fetch orders as transactions for now. Only orders with real payment activity belong
  // on a "Financial Ledger" — this used to also list PENDING (unpaid, abandoned-checkout)
  // orders and render every row as "Completed" / the full order total, overstating actual
  // money collected.
  const transactions = await prisma.order.findMany({
    where: {
      status: { not: 'CANCELLED' },
      amountPaid: { gt: 0 },
    },
    include: {
      user: {
        select: { name: true, email: true }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Financial Ledger</h1>
          <p className={styles.sub}>Track all incoming revenue and payouts.</p>
        </div>
      </div>

      <div className={styles.tableBlock}>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Transaction</th>
                <th>Customer</th>
                <th>Status</th>
                <th>Amount</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => {
                const isFullyPaid = tx.remainingAmount <= 0;
                return (
                  <tr key={tx.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <ArrowUpRight size={16} color="#16a34a" />
                        </div>
                        <div className={styles.mono}>TXN-{tx.id.slice(-6).toUpperCase()}</div>
                      </div>
                    </td>
                    <td>
                      <div className={styles.customerName}>{tx.user.name || "Guest"}</div>
                      <div className={styles.customerEmail}>{tx.user.email}</div>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: isFullyPaid ? '#16a34a' : '#b45309', textTransform: 'uppercase' }}>
                        {isFullyPaid ? 'Completed' : 'Partially Paid'}
                      </span>
                    </td>
                    <td className={styles.amount} style={{ color: '#16a34a' }}>
                      + ₹{tx.amountPaid.toLocaleString()}
                      {!isFullyPaid && (
                        <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: 500, color: 'var(--tth-text-muted)' }}>
                          of ₹{tx.totalAmount.toLocaleString()}
                        </span>
                      )}
                    </td>
                    <td className={styles.date}>{new Date(tx.createdAt).toLocaleDateString("en-IN")}</td>
                  </tr>
                );
              })}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'var(--tth-text-muted)' }}>
                    No transactions recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

