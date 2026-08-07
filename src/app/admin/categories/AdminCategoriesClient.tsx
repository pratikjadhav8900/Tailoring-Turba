"use client";

import { useState } from "react";
import { Plus, Trash2, Folder, Shirt, Loader2 } from "lucide-react";
import styles from "../page.module.css";
import toast from "react-hot-toast";

export default function AdminCategoriesClient({ initialCategories }: { initialCategories: any[] }) {
  const [categories, setCategories] = useState(initialCategories);
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      });

      if (res.ok) {
        window.location.reload(); // Reload to get updated counts and slug
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to add category");
      }
    } catch (e) {
      toast.error("Error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure? This cannot be undone.")) return;
    setIsDeleting(id);

    try {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setCategories(categories.filter(c => c.id !== id));
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to delete");
      }
    } catch (e) {
      toast.error("Error occurred");
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.actions} style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24 }}>
        <button 
          className={styles.addBtn}
          onClick={() => setIsAdding(!isAdding)}
          style={{
            background: 'var(--tth-olive-dark)',
            color: 'white',
            padding: '10px 20px',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: 600,
            fontSize: '0.85rem',
            textTransform: 'uppercase'
          }}
        >
          {isAdding ? "Cancel" : <><Plus size={16} /> New Category</>}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAdd} style={{ background: 'white', padding: 24, border: '1px solid var(--tth-beige-light)', borderRadius: 4, marginBottom: 32 }}>
          <div style={{ display: 'flex', gap: 16 }}>
            <input 
              required
              type="text" 
              placeholder="Category Name (e.g. Summer Essentials)" 
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              style={{ flex: 1, padding: 12, border: '1px solid var(--tth-beige-light)', borderRadius: 4, outline: 'none' }}
            />
            <button 
              disabled={isSubmitting}
              type="submit" 
              style={{ background: 'var(--tth-black)', color: 'white', padding: '0 24px', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 600 }}
            >
              {isSubmitting ? <Loader2 size={16} className={styles.spin} /> : "Create"}
            </button>
          </div>
        </form>
      )}

      <div className={styles.tableBlock}>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Category</th>
                <th>Slug</th>
                <th>Products</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: 32, height: 32, borderRadius: '4px', background: 'var(--tth-offwhite)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Folder size={16} color="var(--tth-olive-dark)" />
                      </div>
                      <div className={styles.customerName}>{cat.name}</div>
                    </div>
                  </td>
                  <td><code style={{ fontSize: '0.85rem', color: 'var(--tth-text-muted)' }}>/{cat.slug}</code></td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem' }}>
                      <Shirt size={14} color="var(--tth-text-muted)" />
                      {cat._count?.products || 0} Products
                    </div>
                  </td>
                  <td>
                    <button 
                      onClick={() => handleDelete(cat.id)}
                      disabled={isDeleting === cat.id}
                      style={{ padding: '8px', border: 'none', background: 'none', cursor: 'pointer', color: isDeleting === cat.id ? '#ccc' : '#c53030' }}
                    >
                      {isDeleting === cat.id ? <Loader2 size={16} className={styles.spin} /> : <Trash2 size={16} />}
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
