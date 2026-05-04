"use client";

import { useState } from "react";
import { Plus, Trash2, Loader2, Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import styles from "./page.module.css";

type Product = any; // We can type this properly later
type Category = any;

export default function AdminProductsClient({ initialProducts, categories }: { initialProducts: Product[], categories: Category[] }) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [isAdding, setIsAdding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    category: "",
    newCategory: "",
    type: "",
    price: "",
    description: "",
    features: "",
    colors: "",
    badge: "",
    imageUrl: "",
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setFormData({ ...formData, imageUrl: data.url });
      } else {
        alert("Upload failed. Please check your Cloudinary credentials in .env");
      }
    } catch (error) {
      console.error(error);
      alert("Error uploading image");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    
    setIsDeleting(id);
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setProducts(products.filter(p => p.id !== id));
      } else {
        alert("Failed to delete product");
      }
    } catch (e) {
      console.error(e);
      alert("Error deleting product");
    } finally {
      setIsDeleting(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const submitData = {
        ...formData,
        category: formData.category === "NEW" ? formData.newCategory : formData.category,
      };

      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      });

      if (res.ok) {
        const newProduct = await res.json();
        // Just reload the page to get the updated list with proper category relations
        window.location.reload();
      } else {
        const errorData = await res.json();
        alert(`Failed to add product: ${errorData.error}`);
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error(error);
      alert("An error occurred");
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className={styles.container}>
      <div className={styles.actions}>
        <button 
          className={styles.addBtn}
          onClick={() => setIsAdding(!isAdding)}
        >
          {isAdding ? "Cancel" : <><Plus size={16} /> Add New Product</>}
        </button>
      </div>

      {isAdding && (
        <div className={`${styles.formCard} glass-card`}>
          <h2 className={styles.formTitle}>Add New Product</h2>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formRow}>
              <div className={styles.inputGroup}>
                <label>Product Name *</label>
                <input required type="text" name="name" value={formData.name} onChange={handleChange} placeholder="e.g. Magic Bio (Men)" />
              </div>
              <div className={styles.inputGroup}>
                <label>Price *</label>
                <input required type="number" step="0.01" min="0" name="price" value={formData.price} onChange={handleChange} placeholder="e.g. 195" />
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.inputGroup}>
                <label>Category *</label>
                <select required name="category" value={formData.category} onChange={handleChange}>
                  <option value="">Select Category</option>
                  {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  <option value="NEW">+ Create New Category</option>
                </select>
              </div>
              {formData.category === "NEW" && (
                <div className={styles.inputGroup}>
                  <label>New Category Name *</label>
                  <input required type="text" name="newCategory" value={formData.newCategory} onChange={handleChange} placeholder="e.g. Summer Collection" />
                </div>
              )}
            </div>

            <div className={styles.formRow}>
              <div className={styles.inputGroup}>
                <label>Type / Subtitle</label>
                <input type="text" name="type" value={formData.type} onChange={handleChange} placeholder="e.g. Round Neck · Cotton" />
              </div>
              <div className={styles.inputGroup}>
                <label>Badge (Optional)</label>
                <input type="text" name="badge" value={formData.badge} onChange={handleChange} placeholder="e.g. Premium, B2B" />
              </div>
              <div className={styles.inputGroup}>
                <label>Available Colors</label>
                <input type="number" name="colors" value={formData.colors} onChange={handleChange} placeholder="e.g. 12" />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label>Product Image</label>
              <div className={styles.uploadContainer}>
                {formData.imageUrl ? (
                  <div className={styles.imagePreview}>
                    <Image src={formData.imageUrl} alt="Preview" fill style={{ objectFit: "cover" }} />
                    <button 
                      type="button" 
                      className={styles.removeImage}
                      onClick={() => setFormData({ ...formData, imageUrl: "" })}
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <label className={styles.uploadPlaceholder}>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleUpload} 
                      style={{ display: "none" }} 
                      disabled={isUploading}
                    />
                    {isUploading ? (
                      <><Loader2 size={24} className={styles.spin} /> <span>Uploading...</span></>
                    ) : (
                      <><Plus size={24} /> <span>Upload Image</span></>
                    )}
                  </label>
                )}
              </div>
              <p className={styles.hint}>Recommended: Square image, min 1000x1000px</p>
            </div>

            <div className={styles.inputGroup}>
              <label>Description</label>
              <textarea name="description" value={formData.description} onChange={handleChange} rows={2} placeholder="Brief product description..."></textarea>
            </div>

            <div className={styles.inputGroup}>
              <label>Features (One per line)</label>
              <textarea name="features" value={formData.features} onChange={handleChange} rows={4} placeholder="180 GSM Super Cotton&#10;Biowash finish"></textarea>
            </div>

            <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
              {isSubmitting ? <><Loader2 size={16} className={styles.spin} /> Saving...</> : "Save Product"}
            </button>
          </form>
        </div>
      )}

      <div className={`${styles.tableBlock} glass-card`}>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Type</th>
                <th>Price</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id}>
                  <td>
                    <div className={styles.productCell}>
                      <div className={styles.imageThumbnail}>
                        {p.images && p.images[0] ? (
                          <Image src={p.images[0]} alt={p.name} fill style={{objectFit:'cover'}} />
                        ) : (
                          <ImageIcon size={16} color="#aaa" />
                        )}
                      </div>
                      <div>
                        <div className={styles.productName}>{p.name}</div>
                        {p.badge && <span className={styles.badge}>{p.badge}</span>}
                      </div>
                    </div>
                  </td>
                  <td>{p.category?.name}</td>
                  <td className={styles.typeText}>{p.type}</td>
                  <td className={styles.price}>₹{p.basePrice}</td>
                  <td>
                    <button 
                      className={styles.deleteBtn} 
                      onClick={() => handleDelete(p.id)}
                      disabled={isDeleting === p.id}
                    >
                      {isDeleting === p.id ? <Loader2 size={14} className={styles.spin} /> : <Trash2 size={14} />}
                    </button>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={5} style={{textAlign:'center', padding:'40px', color:'var(--tth-text-muted)'}}>
                    No products found.
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
