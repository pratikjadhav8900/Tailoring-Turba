"use client";

import { useState } from "react";
import { Plus, Trash2, Loader2, Edit2, Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import styles from "./page.module.css";
import { getResizedCloudinaryUrl } from "@/lib/cloudinary-client";

type Product = any; // We can type this properly later
type Category = any;

export default function AdminProductsClient({ initialProducts, categories }: { initialProducts: Product[], categories: Category[] }) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [isAdding, setIsAdding] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
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
    imageUrls: [] as string[],
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const currentCount = formData.imageUrls.length;
    const allowedCount = 6 - currentCount;
    if (allowedCount <= 0) {
      alert("You can only upload up to 6 images.");
      return;
    }

    const filesToUpload = Array.from(files).slice(0, allowedCount);
    setIsUploading(true);

    const uploadedUrls: string[] = [];

    for (const file of filesToUpload) {
      const uploadData = new FormData();
      uploadData.append("file", file);

      try {
        const res = await fetch("/api/admin/upload", {
          method: "POST",
          body: uploadData,
        });

        if (res.ok) {
          const data = await res.json();
          uploadedUrls.push(data.url);
        } else {
          alert(`Upload failed for ${file.name}. Please check Cloudinary credentials.`);
        }
      } catch (error) {
        console.error(error);
        alert(`Error uploading file ${file.name}`);
      }
    }

    if (uploadedUrls.length > 0) {
      setFormData(prev => ({
        ...prev,
        imageUrl: prev.imageUrl || uploadedUrls[0],
        imageUrls: [...prev.imageUrls, ...uploadedUrls]
      }));
    }

    setIsUploading(false);
  };

  const handleRemoveImage = (indexToRemove: number) => {
    const updatedUrls = formData.imageUrls.filter((_, idx) => idx !== indexToRemove);
    setFormData({
      ...formData,
      imageUrls: updatedUrls,
      imageUrl: updatedUrls[0] || "",
    });
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

  const handleAddNewClick = () => {
    if (isAdding || editingProduct) {
      setIsAdding(false);
      setEditingProduct(null);
    } else {
      setEditingProduct(null);
      setFormData({
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
        imageUrls: [],
      });
      setIsAdding(true);
    }
  };

  const handleEditClick = (p: Product) => {
    setEditingProduct(p);
    setIsAdding(false);
    setFormData({
      name: p.name,
      category: p.category?.name || "",
      newCategory: "",
      type: p.type || "",
      price: String(p.basePrice),
      description: p.description || "",
      features: p.features ? p.features.join("\n") : "",
      colors: p.colors ? String(p.colors) : "",
      badge: p.badge || "",
      imageUrl: p.images && p.images[0] ? p.images[0] : "",
      imageUrls: p.images || [],
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const submitData = {
        ...formData,
        category: formData.category === "NEW" ? formData.newCategory : formData.category,
      };

      const url = editingProduct 
        ? `/api/admin/products/${editingProduct.id}`
        : "/api/admin/products";
      const method = editingProduct ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      });

      if (res.ok) {
        window.location.reload();
      } else {
        const errorData = await res.json();
        alert(`Failed to save product: ${errorData.error}`);
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
          onClick={handleAddNewClick}
        >
          {(isAdding || editingProduct) ? "Cancel" : <><Plus size={16} /> Add New Product</>}
        </button>
      </div>

      {(isAdding || editingProduct) && (
        <div className={`${styles.formCard} glass-card`}>
          <h2 className={styles.formTitle}>
            {editingProduct ? `Edit Product: ${editingProduct.name}` : "Add New Product"}
          </h2>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formRow}>
              <div className={styles.inputGroup}>
                <label>Product Name *</label>
                <input required type="text" name="name" value={formData.name} onChange={handleChange} placeholder="e.g. Turba Bio (Men)" />
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
              <label>Product Images (Max 6)</label>
              <div className={styles.imagesGrid}>
                {formData.imageUrls?.map((url, index) => (
                  <div key={index} className={styles.imageThumbnailSlot}>
                    <Image src={getResizedCloudinaryUrl(url, 200, 200)} alt={`Preview ${index + 1}`} fill style={{ objectFit: "contain" }} />
                    <button 
                      type="button" 
                      className={styles.removeThumbnail}
                      onClick={() => handleRemoveImage(index)}
                      title="Remove Image"
                    >
                      ×
                    </button>
                    {index === 0 && <span className={styles.mainBadge}>Main</span>}
                  </div>
                ))}
                
                {formData.imageUrls?.length < 6 && (
                  <label className={styles.uploadSlot}>
                    <input 
                      type="file" 
                      accept="image/*" 
                      multiple
                      onChange={handleUpload} 
                      style={{ display: "none" }} 
                      disabled={isUploading}
                    />
                    {isUploading ? (
                      <Loader2 size={24} className={styles.spin} />
                    ) : (
                      <>
                        <Plus size={20} />
                        <span style={{ fontSize: '0.75rem', marginTop: '4px' }}>Add Image</span>
                      </>
                    )}
                  </label>
                )}
              </div>
              <p className={styles.hint}>Supported formats: JPG, PNG, WEBP. First image will be used as the primary display image. Double check that images show correctly.</p>
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
              {isSubmitting ? <><Loader2 size={16} className={styles.spin} /> Saving...</> : (editingProduct ? "Save Changes" : "Save Product")}
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
                          <Image src={getResizedCloudinaryUrl(p.images[0], 100, 100)} alt={p.name} fill style={{objectFit:'cover'}} />
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
                    <div className={styles.actionsCell}>
                      <button 
                        className={styles.editBtn} 
                        onClick={() => handleEditClick(p)}
                        title="Edit Product"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        className={styles.deleteBtn} 
                        onClick={() => handleDelete(p.id)}
                        disabled={isDeleting === p.id}
                        title="Delete Product"
                      >
                        {isDeleting === p.id ? <Loader2 size={14} className={styles.spin} /> : <Trash2 size={14} />}
                      </button>
                    </div>
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
