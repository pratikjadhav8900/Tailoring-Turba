import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import styles from "./layout.module.css";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className={styles.shell}>
      <DashboardSidebar user={session.user as { name?: string; email?: string; image?: string }} />
      <main className={styles.main}>
        {children}
      </main>
    </div>
  );
}
