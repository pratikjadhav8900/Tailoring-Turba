import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import styles from "../page.module.css";
import AdminCategoriesClient from "./AdminCategoriesClient";

export default async function AdminCategoriesPage() {
  const session = await auth();
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
    return <div>Unauthorized</div>;
  }

  const categories = await prisma.category.findMany({
    include: {
      _count: {
        select: { products: true }
      }
    }
  });

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Product Categories</h1>
          <p className={styles.sub}>Organize your product catalog by collections.</p>
        </div>
      </div>

      <AdminCategoriesClient initialCategories={categories} />
    </div>
  );
}
