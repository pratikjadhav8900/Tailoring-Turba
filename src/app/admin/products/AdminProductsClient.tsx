"use client";

import { useState } from "react";
import { Plus, Trash2, Loader2, Edit2, Image as ImageIcon, Sparkles } from "lucide-react";
import toast from "react-hot-toast";
import Image from "next/image";
import styles from "./page.module.css";
import { getResizedCloudinaryUrl } from "@/lib/cloudinary-client";
import { generateSlug } from "@/lib/slug";
import { generateProductSeo } from "@/lib/seo-generator";
import { isValidHex, normalizeHex, suggestColorName } from "@/lib/customizer-utils";

type Product = any; // We can type this properly later
type Category = any;

export default function AdminProductsClient({ initialProducts, categories }: { initialProducts: Product[], categories: Category[] }) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [isAdding, setIsAdding] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);
  const [slugConflictError, setSlugConflictError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    category: "",
    newCategory: "",
    type: "",
    price: "",
    description: "",
    features: "",
    colors: "",
    colorsJson: [] as { name: string; value: string; hex?: string; imageUrls: string[]; image?: string }[],
    badge: "",
    imageUrl: "",
    imageUrls: [] as string[],
    isActive: true,
    seoTitle: "",
    seoDescription: "",
    seoKeywords: "",
    slug: "",
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const currentCount = formData.imageUrls.length;
    const allowedCount = 6 - currentCount;
    if (allowedCount <= 0) {
      toast.error("You can only upload up to 6 images.");
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
          toast.error(`Upload failed for ${file.name}. Please check Cloudinary credentials.`);
        }
      } catch (error) {
        console.error(error);
        toast.error(`Error uploading file ${file.name}`);
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
    const removedUrl = formData.imageUrls[indexToRemove];
    const updatedUrls = formData.imageUrls.filter((_, idx) => idx !== indexToRemove);
    const updatedColors = formData.colorsJson?.map(c => ({
      ...c,
      imageUrls: (c.imageUrls || []).filter(u => u !== removedUrl),
      image: c.image === removedUrl ? "" : c.image
    })) || [];

    setFormData({
      ...formData,
      imageUrls: updatedUrls,
      imageUrl: updatedUrls[0] || "",
      colorsJson: updatedColors,
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
        toast.error("Failed to delete product");
      }
    } catch (e) {
      console.error(e);
      toast.error("Error deleting product");
    } finally {
      setIsDeleting(null);
    }
  };

  const handleToggleActive = async (product: Product) => {
    const updatedStatus = product.isActive === false ? true : false;
    
    // Optimistically update UI
    setProducts(prev => prev.map(p => p.id === product.id ? { ...p, isActive: updatedStatus } : p));
    
    try {
      const submitData = {
        name: product.name,
        category: product.category?.name || "",
        type: product.type || "",
        price: String(product.basePrice),
        description: product.description || "",
        features: product.features ? product.features.join("\n") : "",
        colors: product.colors ? String(product.colors) : "",
        badge: product.badge || "",
        imageUrl: product.images && product.images[0] ? product.images[0] : "",
        imageUrls: product.images || [],
        isActive: updatedStatus,
      };

      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      });

      if (!res.ok) {
        // Revert state on error
        setProducts(prev => prev.map(p => p.id === product.id ? { ...p, isActive: !updatedStatus } : p));
        toast.error("Failed to update product status");
      } else {
        toast.success(`Product is now ${updatedStatus ? "Active" : "Offline"}`);
      }
    } catch (error) {
      // Revert state on error
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, isActive: !updatedStatus } : p));
      console.error(error);
      toast.error("Error updating product status");
    }
  };

  const handleAddNewClick = () => {
    setIsSlugManuallyEdited(false);
    setSlugConflictError("");
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
        colorsJson: [],
        badge: "",
        imageUrl: "",
        imageUrls: [],
        isActive: true,
        seoTitle: "",
        seoDescription: "",
        seoKeywords: "",
        slug: "",
      });
      setIsAdding(true);
    }
  };

  const handleAutoGenerateSeo = () => {
    const name = formData.name.trim();
    if (!name) {
      toast.error("Please enter a product name first.");
      return;
    }

    const generated = generateProductSeo({
      name: formData.name,
      category: formData.category === "NEW" ? formData.newCategory : formData.category,
      type: formData.type,
      badge: formData.badge,
      description: formData.description,
      features: formData.features,
      colors: formData.colors,
      price: formData.price,
    });

    setFormData(prev => ({
      ...prev,
      seoTitle: generated.seoTitle,
      seoDescription: generated.seoDescription,
      slug: generated.slug,
      seoKeywords: generated.seoKeywords,
    }));
    setIsSlugManuallyEdited(true);
    toast.success("SEO fields auto-generated from product data!");
  };

  const handleEditClick = (p: Product) => {
    setEditingProduct(p);
    setIsAdding(false);
    setIsSlugManuallyEdited(!!p.slug);
    setSlugConflictError("");

    setFormData({
      name: p.name || "",
      category: p.category?.name || "",
      newCategory: "",
      type: p.type || "",
      price: String(p.basePrice || ""),
      description: p.description || "",
      features: p.features ? (Array.isArray(p.features) ? p.features.join("\n") : p.features) : "",
      colors: p.colors ? String(p.colors) : "",
      colorsJson: (() => {
        const rawColors = p.colorsJson ? (typeof p.colorsJson === 'string' ? JSON.parse(p.colorsJson) : p.colorsJson) : [];
        return Array.isArray(rawColors) ? rawColors.map((c: any) => {
          let urls: string[] = [];
          if (Array.isArray(c.imageUrls)) {
            urls = c.imageUrls.filter(Boolean);
          } else if (c.image || c.imageUrl) {
            urls = [c.image || c.imageUrl];
          }
          return {
            name: c.name || "",
            value: c.value || c.hex || "#000000",
            hex: c.value || c.hex || "#000000",
            imageUrls: urls,
            image: urls[0] || ""
          };
        }) : [];
      })(),
      badge: p.badge || "",
      imageUrl: p.images && p.images[0] ? p.images[0] : "",
      imageUrls: p.images || [],
      isActive: p.isActive !== false,
      seoTitle: p.seoTitle || "",
      seoDescription: p.seoDescription || "",
      seoKeywords: p.seoKeywords || "",
      slug: p.slug || generateSlug(p.name || ""),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate and clean slug one final time
    const finalSlug = generateSlug(formData.slug);
    if (!finalSlug) {
      toast.error("URL handle cannot be empty.");
      return;
    }
    const isDuplicate = products.some(
      p => p.slug === finalSlug && (!editingProduct || p.id !== editingProduct.id)
    );
    if (isDuplicate) {
      toast.error("URL handle is already in use by another product.");
      return;
    }

    if (formData.colorsJson && formData.colorsJson.length > 0) {
      const seenNames = new Set<string>();
      const normalizedColors = [];

      for (let i = 0; i < formData.colorsJson.length; i++) {
        const color = formData.colorsJson[i];
        const name = (color.name || "").trim();
        const rawHex = (color.value || "").trim();

        if (!name) {
          toast.error(`Color #${i + 1} name cannot be blank.`);
          return;
        }
        if (!isValidHex(rawHex)) {
          toast.error(`Color "${name}" has an invalid hex value "${rawHex}". Use #RGB or #RRGGBB.`);
          return;
        }

        const normalizedHex = normalizeHex(rawHex);
        if (seenNames.has(name.toLowerCase())) {
          toast.error(`Duplicate color name found: "${name}".`);
          return;
        }
        seenNames.add(name.toLowerCase());

        // Validate and clean mapped image URLs against uploaded product images
        const validUrls = Array.from(new Set(
          (color.imageUrls || []).filter(u => formData.imageUrls.includes(u))
        ));

        normalizedColors.push({
          name,
          value: normalizedHex,
          hex: normalizedHex,
          imageUrls: validUrls,
          image: validUrls[0] || "",
          imageUrl: validUrls[0] || ""
        });
      }

      // Update formData with cleaned colors
      formData.colorsJson = normalizedColors;
    }

    setIsSubmitting(true);
    
    try {
      const submitData = {
        ...formData,
        slug: finalSlug,
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
        toast.error(`Failed to save product: ${errorData.error}`);
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred");
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === "name") {
      setFormData(prev => {
        const nextData = { ...prev, name: value };
        if (!isSlugManuallyEdited) {
          const newSlug = generateSlug(value);
          nextData.slug = newSlug;
          const isDuplicate = products.some(
            p => p.slug === newSlug && (!editingProduct || p.id !== editingProduct.id)
          );
          if (isDuplicate && newSlug) {
            setSlugConflictError("Suggested URL handle is already in use.");
          } else {
            setSlugConflictError("");
          }
        }
        return nextData;
      });
    } else if (name === "slug") {
      setIsSlugManuallyEdited(true);
      const looserSlug = value.toLowerCase().replace(/[^a-z0-9-]/g, "");
      setFormData(prev => ({ ...prev, slug: looserSlug }));
      
      if (!looserSlug) {
        setSlugConflictError("URL handle cannot be empty.");
      } else if (!/^[a-z0-9-]+$/.test(looserSlug)) {
        setSlugConflictError("URL handle can only contain lowercase letters, numbers, and hyphens.");
      } else {
        const isDuplicate = products.some(
          p => p.slug === looserSlug && (!editingProduct || p.id !== editingProduct.id)
        );
        if (isDuplicate) {
          setSlugConflictError("URL handle is already in use.");
        } else {
          setSlugConflictError("");
        }
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
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
            </div>

            <div className={styles.formRow}>
              <div className={styles.inputGroup}>
                <label>Available Colors Count</label>
                <input type="number" name="colors" value={formData.colors} onChange={handleChange} placeholder="e.g. 12" />
              </div>
              <div className={styles.inputGroup}>
                <label>Status</label>
                <select 
                  name="isActive" 
                  value={formData.isActive ? "true" : "false"} 
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.value === "true" })}
                >
                  <option value="true">Active (Live on website)</option>
                  <option value="false">Offline (Hidden from website)</option>
                </select>
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

            {/* AVAILABLE COLORS SECTION */}
            <div className={styles.inputGroup} style={{ borderTop: "1px solid var(--tth-beige-light)", paddingTop: "24px", marginTop: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
                <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--tth-text-muted)" }}>Available Colors</label>
                <span style={{ fontSize: "0.75rem", color: "var(--tth-text-muted)" }}>
                  {formData.colorsJson?.length || 0} {formData.colorsJson?.length === 1 ? "color configured" : "colors configured"}
                </span>
              </div>
              <span className={styles.hint} style={{ margin: "-2px 0 14px 0", display: "block" }}>
                Add the exact available colors for this product. Use the color picker or enter a HEX code. Optionally map each color to a product photo for the product page.
              </span>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%" }}>
                {formData.colorsJson?.map((color, index) => {
                  const isHexValid = isValidHex(color.value);
                  const normalizedValue = isHexValid ? normalizeHex(color.value) : "#000000";

                  return (
                    <div 
                      key={index} 
                      style={{ 
                        display: "flex", 
                        flexDirection: "column",
                        gap: "6px", 
                        background: "var(--tth-offwhite)", 
                        padding: "12px", 
                        borderRadius: "6px",
                        border: isHexValid ? "1px solid var(--tth-beige-light)" : "1px solid #fca5a5"
                      }}
                    >                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", width: "100%" }}>
                        {/* Color Swatch / Native Color Picker */}
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                          <div 
                            style={{ 
                              position: "relative",
                              width: "36px", 
                              height: "36px", 
                              borderRadius: "50%", 
                              border: "2px solid #cbd5e1",
                              boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.1)",
                              backgroundColor: isHexValid ? normalizedValue : "#e2e8f0",
                              overflow: "hidden",
                              cursor: "pointer",
                              flexShrink: 0
                            }}
                            title="Click to open color picker"
                          >
                            <input 
                              type="color" 
                              value={normalizedValue} 
                              onChange={(e) => {
                                const newHex = e.target.value.toUpperCase();
                                const updated = [...formData.colorsJson];
                                updated[index].value = newHex;
                                // If color name is currently empty or matches previous auto-suggestion, suggest new name
                                if (!updated[index].name.trim()) {
                                  updated[index].name = suggestColorName(newHex);
                                }
                                setFormData({ ...formData, colorsJson: updated });
                              }}
                              style={{ 
                                position: "absolute", 
                                top: "-50%", 
                                left: "-50%", 
                                width: "200%", 
                                height: "200%", 
                                opacity: 0, 
                                cursor: "pointer" 
                              }}
                              title="Choose color swatch"
                            />
                          </div>

                          {/* HEX Value Input */}
                          <input 
                            type="text" 
                            value={color.value} 
                            onChange={(e) => {
                              const updated = [...formData.colorsJson];
                              updated[index].value = e.target.value;
                              setFormData({ ...formData, colorsJson: updated });
                            }}
                            onBlur={() => {
                              if (isValidHex(color.value)) {
                                const updated = [...formData.colorsJson];
                                updated[index].value = normalizeHex(color.value);
                                setFormData({ ...formData, colorsJson: updated });
                              }
                            }}
                            placeholder="#000000"
                            style={{ 
                              width: "85px", 
                              padding: "8px 8px", 
                              fontSize: "0.85rem", 
                              fontFamily: "monospace",
                              fontWeight: 600,
                              border: isHexValid ? "1px solid var(--tth-beige-light)" : "1px solid #ef4444", 
                              borderRadius: "4px",
                              backgroundColor: "white",
                              color: "var(--tth-navy)",
                              boxSizing: "border-box"
                            }}
                          />
                        </div>

                        {/* Color Name Input + Suggest Name Button */}
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", flex: "1 1 180px", minWidth: 0 }}>
                          <input 
                            type="text" 
                            value={color.name} 
                            onChange={(e) => {
                              const updated = [...formData.colorsJson];
                              updated[index].name = e.target.value;
                              setFormData({ ...formData, colorsJson: updated });
                            }}
                            placeholder="Color Name (e.g. Maroon, Navy Blue)"
                            style={{ 
                              flex: 1, 
                              minWidth: 0,
                              width: "100%",
                              padding: "8px 10px", 
                              fontSize: "0.85rem", 
                              border: "1px solid var(--tth-beige-light)", 
                              borderRadius: "4px", 
                              backgroundColor: "white",
                              boxSizing: "border-box"
                            }}
                            required
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const suggested = suggestColorName(color.value);
                              const updated = [...formData.colorsJson];
                              updated[index].name = suggested;
                              setFormData({ ...formData, colorsJson: updated });
                              toast.success(`Suggested name: ${suggested}`, { duration: 1500 });
                            }}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                              padding: "8px 8px",
                              fontSize: "0.75rem",
                              fontWeight: 600,
                              background: "#f1f5f9",
                              border: "1px solid #cbd5e1",
                              borderRadius: "4px",
                              color: "#334155",
                              cursor: "pointer",
                              whiteSpace: "nowrap",
                              flexShrink: 0
                            }}
                            title="Suggest Color Name from HEX"
                          >
                            <Sparkles size={13} color="#6366f1" />
                            Suggest
                          </button>
                        </div>

                        {/* Remove button */}
                        <button 
                          type="button" 
                          onClick={() => {
                            const updated = formData.colorsJson.filter((_, idx) => idx !== index);
                            setFormData({ ...formData, colorsJson: updated });
                          }}
                          style={{ 
                            background: "none", 
                            border: "none", 
                            color: "#ef4444", 
                            cursor: "pointer", 
                            fontSize: "1.3rem", 
                            padding: "2px 6px",
                            lineHeight: 1,
                            flexShrink: 0
                          }}
                          title="Remove Color"
                        >
                          ×
                        </button>
                      </div>

                      {/* Multi-image selection section */}
                      <div style={{ marginTop: "4px", paddingTop: "8px", borderTop: "1px dashed #cbd5e1" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#334155" }}>
                            Mapped Gallery Photos ({(color.imageUrls || []).length} selected):
                          </span>
                          {(color.imageUrls || []).length > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                const updated = [...formData.colorsJson];
                                updated[index].imageUrls = [];
                                updated[index].image = "";
                                setFormData({ ...formData, colorsJson: updated });
                              }}
                              style={{ fontSize: "0.7rem", color: "#64748b", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
                            >
                              Clear selection
                            </button>
                          )}
                        </div>

                        {formData.imageUrls && formData.imageUrls.length > 0 ? (
                          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                            {formData.imageUrls.map((url, imgIdx) => {
                              const isSelected = (color.imageUrls || []).includes(url);
                              return (
                                <button
                                  key={imgIdx}
                                  type="button"
                                  onClick={() => {
                                    const updated = [...formData.colorsJson];
                                    const currentUrls = updated[index].imageUrls || [];
                                    let nextUrls: string[];
                                    if (isSelected) {
                                      nextUrls = currentUrls.filter(u => u !== url);
                                    } else {
                                      nextUrls = [...currentUrls, url];
                                    }
                                    updated[index].imageUrls = nextUrls;
                                    updated[index].image = nextUrls[0] || "";
                                    setFormData({ ...formData, colorsJson: updated });
                                  }}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    padding: "4px 8px 4px 4px",
                                    borderRadius: "6px",
                                    border: isSelected ? "2px solid #0f172a" : "1px solid #cbd5e1",
                                    background: isSelected ? "#e2e8f0" : "white",
                                    cursor: "pointer",
                                    transition: "all 0.15s ease",
                                    boxShadow: isSelected ? "0 1px 2px rgba(0,0,0,0.1)" : "none"
                                  }}
                                  title={isSelected ? `Photo ${imgIdx + 1} selected (Click to unassign)` : `Click to assign Photo ${imgIdx + 1}`}
                                >
                                  <div style={{ width: "26px", height: "26px", borderRadius: "4px", overflow: "hidden", position: "relative", flexShrink: 0, border: "1px solid #cbd5e1" }}>
                                    <img
                                      src={getResizedCloudinaryUrl(url, 80, 80)}
                                      alt={`Photo ${imgIdx + 1}`}
                                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                    />
                                  </div>
                                  <span style={{ fontSize: "0.75rem", fontWeight: isSelected ? 700 : 500, color: isSelected ? "#0f172a" : "#475569" }}>
                                    {isSelected ? "✓ " : ""}Photo {imgIdx + 1}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <span style={{ fontSize: "0.75rem", color: "#94a3b8", fontStyle: "italic" }}>
                            Upload product photos above to map them to this color.
                          </span>
                        )}
                      </div>

                      {/* Inline Validation message if invalid HEX */}
                      {!isHexValid && color.value.trim().length > 0 && (
                        <div style={{ fontSize: "0.75rem", color: "#ef4444", fontWeight: 500 }}>
                          Invalid color value. Use #RGB or #RRGGBB.
                        </div>
                      )}
                    </div>
                  );
                })}

                <div>
                  <button 
                    type="button" 
                    onClick={() => {
                      const updated = [...(formData.colorsJson || [])];
                      const defaultHex = "#000000";
                      updated.push({ 
                        name: suggestColorName(defaultHex), 
                        value: defaultHex, 
                        imageUrls: [] 
                      });
                      setFormData({ ...formData, colorsJson: updated });
                    }}
                    style={{ 
                      background: "white", 
                      border: "1px solid var(--tth-beige-light)", 
                      padding: "8px 16px", 
                      borderRadius: "4px", 
                      fontSize: "0.85rem", 
                      fontWeight: 600, 
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px"
                    }}
                  >
                    <Plus size={16} /> Add Color
                  </button>
                </div>
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label>Description</label>
              <textarea name="description" value={formData.description} onChange={handleChange} rows={2} placeholder="Brief product description..."></textarea>
            </div>

            <div className={styles.inputGroup}>
              <label>Features (One per line)</label>
              <textarea name="features" value={formData.features} onChange={handleChange} rows={4} placeholder="180 GSM Super Cotton&#10;Biowash finish"></textarea>
            </div>

            {/* Search Engine Listing / SEO Section */}
            <div className={styles.seoSectionHeader}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <h3 className={styles.formTitle} style={{ margin: 0 }}>Search engine listing</h3>
                <button 
                  type="button" 
                  onClick={handleAutoGenerateSeo} 
                  className={styles.autoSeoBtn}
                  title="Auto-fill recommended SEO title, description, and keywords based on product details"
                >
                  <Sparkles size={14} /> Auto-Generate SEO
                </button>
              </div>
              <p className={styles.hint} style={{ margin: '0 0 16px 0' }}>
                Add a title and description to customize how this product appears in Google search results.
              </p>
            </div>

            <div className={styles.seoPreviewCard}>
              <span className={styles.seoPreviewTitle}>
                {formData.seoTitle || formData.name || "Product Name"}
              </span>
              <span className={styles.seoPreviewUrl}>
                tailoringturba.com/products/{formData.slug || generateSlug(formData.name) || "slug"}
              </span>
              <p className={styles.seoPreviewSnippet}>
                {formData.seoDescription || formData.description || "Enter a description to see how it will appear in search results."}
              </p>
            </div>

            <div className={styles.inputGroup}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label>Page Title</label>
                <span className={styles.counterText}>
                  {formData.seoTitle.length} characters
                </span>
              </div>
              <input 
                type="text" 
                name="seoTitle" 
                value={formData.seoTitle} 
                onChange={handleChange} 
                placeholder={formData.name || "Enter custom title for search engine listing..."} 
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '3px' }}>
                <span className={styles.counterGuidance}>
                  Recommended: 50–60 characters · Max guidance: 70 characters
                </span>
              </div>
              {formData.seoTitle.length > 70 && (
                <p className={styles.counterNotice}>
                  Notice: Title exceeds 70 characters and may be truncated by search engines.
                </p>
              )}
            </div>

            <div className={styles.inputGroup}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label>Meta Description</label>
                <span className={styles.counterText}>
                  {formData.seoDescription.length} characters
                </span>
              </div>
              <textarea 
                name="seoDescription" 
                value={formData.seoDescription} 
                onChange={handleChange} 
                rows={3} 
                placeholder={formData.description || "Enter custom description for search engine listing..."}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '3px' }}>
                <span className={styles.counterGuidance}>
                  Recommended: 150–160 characters
                </span>
              </div>
              {formData.seoDescription.length > 160 && (
                <p className={styles.counterNotice}>
                  Notice: Description exceeds 160 characters and may be truncated in search snippets.
                </p>
              )}
            </div>

            <div className={styles.inputGroup}>
              <label>URL Handle</label>
              <div className={styles.slugInputWrapper}>
                <span className={styles.slugPrefix}>tailoringturba.com/products/</span>
                <input 
                  type="text" 
                  name="slug" 
                  value={formData.slug} 
                  onChange={handleChange} 
                  placeholder={generateSlug(formData.name) || "url-handle"}
                  className={styles.slugInput}
                />
              </div>
              {slugConflictError ? (
                <p className={styles.counterWarning} style={{ fontSize: '0.75rem', marginTop: '2px' }}>
                  {slugConflictError}
                </p>
              ) : (
                <p className={styles.hint} style={{ marginTop: '4px' }}>
                  This is the unique URL handle (slug) for this product page.
                </p>
              )}
            </div>

            <div className={styles.inputGroup}>
              <label>SEO Keywords (Internal Search)</label>
              <input 
                type="text" 
                name="seoKeywords" 
                value={formData.seoKeywords} 
                onChange={handleChange} 
                placeholder="e.g. corporate polo, custom cotton t-shirt, wholesale hoodies"
              />
              <p className={styles.hint} style={{ marginTop: '4px' }}>
                Comma-separated keywords/tags. These keywords are primarily used for search optimization on Tailoring Turba.
              </p>
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
                <th>Status</th>
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
                    <button
                      type="button"
                      className={`${styles.statusToggleBtn} ${p.isActive !== false ? styles.activeStatus : styles.offlineStatus}`}
                      onClick={() => handleToggleActive(p)}
                      title="Click to toggle product active status"
                    >
                      {p.isActive !== false ? "Active" : "Offline"}
                    </button>
                  </td>
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
