export const dynamic = 'force-dynamic';
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import styles from "../page.module.css";
import { User, ShieldCheck, Mail, Phone } from "lucide-react";

export default async function AdminUsersPage() {
  const session = await auth();
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
    return <div>Unauthorized</div>;
  }

  const users = await prisma.user.findMany({
    orderBy: {
      createdAt: 'desc'
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      isB2BApproved: true
    }
  });

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>User Management</h1>
          <p className={styles.sub}>Manage customer accounts and access levels.</p>
        </div>
      </div>

      <div className={styles.tableBlock}>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Role</th>
                <th>B2B Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--tth-offwhite)', display: 'flex', alignItems: 'center', justifyCenter: 'center' }}>
                        <User size={16} color="var(--tth-text-muted)" />
                      </div>
                      <div>
                        <div className={styles.customerName}>{user.name || "Unnamed User"}</div>
                        <div className={styles.customerEmail}>{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '4px 8px',
                        borderRadius: '4px',
                        background: user.role === 'ADMIN' ? 'rgba(74, 92, 63, 0.1)' : '#f3f4f6',
                        color: user.role === 'ADMIN' ? 'var(--tth-olive-dark)' : '#4b5563'
                    }}>
                      {user.role === 'ADMIN' && <ShieldCheck size={12} />}
                      {user.role}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.85rem', color: user.isB2BApproved ? 'var(--tth-olive)' : 'var(--tth-text-muted)' }}>
                      {user.isB2BApproved ? "✅ Approved" : "⏳ Pending"}
                    </span>
                  </td>
                  <td className={styles.date}>{new Date(user.createdAt).toLocaleDateString("en-IN")}</td>
                  <td>
                    <button style={{ padding: '8px', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--tth-olive-dark)' }}>
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

