import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminMobileNav from "@/components/admin/AdminMobileNav";
import styles from "./layout.module.css";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;

  if (!session || (role !== "ADMIN" && role !== "SUPER_ADMIN")) {
    redirect("/login");
  }

  return (
    <div className={styles.shell}>
      <AdminSidebar role={role!} />
      <main className={styles.main}>{children}</main>
      <AdminMobileNav role={role!} />
    </div>
  );
}
