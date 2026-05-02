export const dynamic = 'force-dynamic';
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import styles from "./page.module.css";
import AdminProductsClient from "./AdminProductsClient";

export default async function AdminProductsPage() {
  const session = await auth();
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
    return <div>Unauthorized</div>;
  }

  // Fetch products with their categories
  const products = await prisma.product.findMany({
    include: {
      category: true,
    },
    orderBy: {
      createdAt: 'desc',
    }
  });

  // Fetch unique categories for the dropdown in the Add form
  const categories = await prisma.category.findMany();

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Product Catalog</h1>
          <p className={styles.sub}>Manage the B2B catalog shown to customers.</p>
        </div>
      </div>

      <AdminProductsClient initialProducts={products} categories={categories} />
    </div>
  );
}

