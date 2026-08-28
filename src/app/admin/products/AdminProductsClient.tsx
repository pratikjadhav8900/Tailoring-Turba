"use client";

import { useState } from "react";
import { Plus, Trash2, Loader2, Edit2, Image as ImageIcon, Sparkles, ArrowLeft, ArrowRight, Check, X } from "lucide-react";
import toast from "react-hot-toast";
import Image from "next/image";
import styles from "./page.module.css";
import { getResizedCloudinaryUrl } from "@/lib/cloudinary-client";
import { generateSlug } from "@/lib/slug";
import { generateProductSeo } from "@/lib/seo-generator";
import { isValidHex, normalizeHex, suggestColorName } from "@/lib/customizer-utils";
import {
  DEPARTMENTS,
  CATEGORIES_BY_DEPARTMENT,
  PRODUCT_TYPES_BY_CATEGORY,
  STYLES_BY_PRODUCT_TYPE,
  ALL_PRODUCT_TYPES,
  ALL_STYLES,
  GENDERS,
  QUALITY_TIERS,
  FITS,
  NECK_TYPES,
  SLEEVE_TYPES,
  FABRICS,
  PATTERNS,
  STANDARD_SIZES,
  IMAGE_VIEW_TYPES,
  ImageViewType,
  ProductMediaItem,
  deriveProductType,
  deriveGender,
  deriveQualityTier
} from "@/lib/catalog-config";

type Product = any;
type Category = any;

interface ColorVariantForm {
  name: string;
  value: string;
  hex?: string;
  imageUrls: string[];
  image?: string;
  imageUrl?: string;
}

export default function AdminProductsClient({ initialProducts, categories }: { initialProducts: Product[], categories: Category[] }) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [isAdding, setIsAdding] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);
  const [slugConflictError, setSlugConflictError] = useState("");
  const [customSizeInput, setCustomSizeInput] = useState("");

  const [formData, setFormData] = useState({
    // Section 1: Basic Information
    name: "",
    sku: "",
    brand: "Tailoring Turba",
    price: "",
    minOrderQuantity: 10,
    isActive: true,
    badge: "",
    shortDescription: "",
    description: "",
    features: "",

    // Section 2: Product Classification
    department: "Apparel",
    category: "Tops",
    newCategory: "",
    productType: "Polo",
    style: "Classic Polo Collar",
    gender: "Men",
    qualityTier: "Standard",
    collection: "Core Essentials",

    // Section 3: Fabric & Specifications
    fabric: "100% Combed Cotton",
    fabricComposition: "100% Combed Cotton",
    gsm: "220",
    fit: "Regular",
    neckType: "Polo Collar",
    sleeveType: "Half Sleeve",
    pattern: "Solid / Plain",
    careInstructions: "Machine wash cold with like colors. Do not bleach. Tumble dry low. Warm iron if needed.",
    countryOfOrigin: "India",

    // Section 4: Available Sizes
    sizes: ["S", "M", "L", "XL", "2XL"] as string[],

    // Section 5: Product Media
    imageUrl: "",
    imageUrls: [] as string[],
    mediaMetadata: [] as ProductMediaItem[],

    // Section 6: Available Colors
    colors: "",
    colorsJson: [] as ColorVariantForm[],

    // Section 7: SEO
    seoTitle: "",
    seoDescription: "",
    seoKeywords: "",
    slug: "",
  });

  // Dependent dropdown helpers
  const availableCategories = CATEGORIES_BY_DEPARTMENT[formData.department] || CATEGORIES_BY_DEPARTMENT["Apparel"] || [];
  const availableProductTypes = PRODUCT_TYPES_BY_CATEGORY[formData.category] || ALL_PRODUCT_TYPES;
  const availableStyles = STYLES_BY_PRODUCT_TYPE[formData.productType] || ALL_STYLES;

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const currentCount = formData.imageUrls.length;
    const allowedCount = 50 - currentCount;
    if (allowedCount <= 0) {
      toast.error("You can only upload up to 50 images.");
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
      const newUrls = [...formData.imageUrls, ...uploadedUrls];
      const newMeta: ProductMediaItem[] = [
        ...formData.mediaMetadata,
        ...uploadedUrls.map((url, idx) => ({
          url,
          sortOrder: formData.mediaMetadata.length + idx,
          isMain: formData.mediaMetadata.length === 0 && idx === 0,
          viewType: (idx === 0 && formData.mediaMetadata.length === 0 ? "Front" : "Detail") as ImageViewType,
        }))
      ];

      setFormData(prev => ({
        ...prev,
        imageUrl: prev.imageUrl || newUrls[0],
        imageUrls: newUrls,
        mediaMetadata: newMeta
      }));
    }

    setIsUploading(false);
  };

  const handleRemoveImage = (indexToRemove: number) => {
    const removedUrl = formData.imageUrls[indexToRemove];
    const updatedUrls = formData.imageUrls.filter((_, idx) => idx !== indexToRemove);
    const updatedMeta = formData.mediaMetadata.filter((_, idx) => idx !== indexToRemove).map((m, idx) => ({
      ...m,
      sortOrder: idx,
      isMain: idx === 0
    }));

    // Auto-remove the deleted photo from all color mappings
    const updatedColors = formData.colorsJson?.map(c => ({
      ...c,
      imageUrls: (c.imageUrls || []).filter(u => u !== removedUrl),
      image: c.image === removedUrl ? "" : c.image
    })) || [];

    setFormData({
      ...formData,
      imageUrls: updatedUrls,
      imageUrl: updatedUrls[0] || "",
      mediaMetadata: updatedMeta,
      colorsJson: updatedColors,
    });
  };

  const handleMoveImage = (index: number, direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= formData.imageUrls.length) return;

    const updatedUrls = [...formData.imageUrls];
    const tempUrl = updatedUrls[index];
    updatedUrls[index] = updatedUrls[targetIndex];
    updatedUrls[targetIndex] = tempUrl;

    const updatedMeta = [...formData.mediaMetadata];
    if (updatedMeta[index] && updatedMeta[targetIndex]) {
      const tempMeta = updatedMeta[index];
      updatedMeta[index] = updatedMeta[targetIndex];
      updatedMeta[targetIndex] = tempMeta;
      updatedMeta.forEach((m, idx) => {
        m.sortOrder = idx;
        m.isMain = idx === 0;
      });
    }

    setFormData({
      ...formData,
      imageUrls: updatedUrls,
      imageUrl: updatedUrls[0] || "",
      mediaMetadata: updatedMeta,
    });
  };

  const handleSetMainImage = (index: number) => {
    if (index === 0) return;
    const selectedUrl = formData.imageUrls[index];
    const updatedUrls = [selectedUrl, ...formData.imageUrls.filter((_, idx) => idx !== index)];
    
    let updatedMeta = [...formData.mediaMetadata];
    if (updatedMeta[index]) {
      const selectedMeta = updatedMeta[index];
      updatedMeta = [selectedMeta, ...updatedMeta.filter((_, idx) => idx !== index)];
      updatedMeta.forEach((m, idx) => {
        m.sortOrder = idx;
        m.isMain = idx === 0;
      });
    }

    setFormData({
      ...formData,
      imageUrls: updatedUrls,
      imageUrl: updatedUrls[0] || "",
      mediaMetadata: updatedMeta,
    });
  };

  const handleUpdateViewType = (index: number, viewType: ImageViewType) => {
    const updatedMeta = [...formData.mediaMetadata];
    if (updatedMeta[index]) {
      updatedMeta[index].viewType = viewType;
      setFormData({ ...formData, mediaMetadata: updatedMeta });
    } else {
      // Create if missing
      const url = formData.imageUrls[index];
      if (url) {
        updatedMeta[index] = {
          url,
          sortOrder: index,
          isMain: index === 0,
          viewType
        };
        setFormData({ ...formData, mediaMetadata: updatedMeta });
      }
    }
  };

  const handleToggleSize = (size: string) => {
    const currentSizes = formData.sizes || [];
    if (currentSizes.includes(size)) {
      setFormData({ ...formData, sizes: currentSizes.filter(s => s !== size) });
    } else {
      setFormData({ ...formData, sizes: [...currentSizes, size] });
    }
  };

  const handleAddCustomSize = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = customSizeInput.trim().toUpperCase();
    if (!clean) return;
    if (formData.sizes.includes(clean)) {
      toast.error(`Size ${clean} is already added.`);
      return;
    }
    setFormData({ ...formData, sizes: [...formData.sizes, clean] });
    setCustomSizeInput("");
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
        toast.success("Product deleted successfully");
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
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: product.name,
          category: product.category?.name || "Tops",
          price: String(product.basePrice),
          isActive: updatedStatus,
        }),
      });

      if (!res.ok) {
        setProducts(prev => prev.map(p => p.id === product.id ? { ...p, isActive: !updatedStatus } : p));
        toast.error("Failed to update product status");
      } else {
        toast.success(`Product is now ${updatedStatus ? "Active" : "Offline"}`);
      }
    } catch (error) {
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
        sku: "",
        brand: "Tailoring Turba",
        price: "",
        minOrderQuantity: 10,
        isActive: true,
        badge: "",
        shortDescription: "",
        description: "",
        features: "",
        department: "Apparel",
        category: "Tops",
        newCategory: "",
        productType: "Polo",
        style: "Classic Polo Collar",
        gender: "Men",
        qualityTier: "Standard",
        collection: "Core Essentials",
        fabric: "100% Combed Cotton",
        fabricComposition: "100% Combed Cotton",
        gsm: "220",
        fit: "Regular",
        neckType: "Polo Collar",
        sleeveType: "Half Sleeve",
        pattern: "Solid / Plain",
        careInstructions: "Machine wash cold with like colors. Do not bleach. Tumble dry low. Warm iron if needed.",
        countryOfOrigin: "India",
        sizes: ["S", "M", "L", "XL", "2XL"],
        imageUrl: "",
        imageUrls: [],
        mediaMetadata: [],
        colors: "",
        colorsJson: [],
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
      category: formData.category,
      type: `${formData.productType} · ${formData.gsm} GSM`,
      badge: formData.badge,
      description: formData.description,
      features: formData.features,
      colors: String(formData.colorsJson.length),
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
    toast.success("SEO fields auto-generated!");
  };

  const handleEditClick = (p: Product) => {
    setEditingProduct(p);
    setIsAdding(false);
    setIsSlugManuallyEdited(!!p.slug);
    setSlugConflictError("");

    const derivedPType = deriveProductType(p);
    const derivedG = deriveGender(p);
    const derivedQ = deriveQualityTier(p);

    const rawColors = p.colorsJson ? (typeof p.colorsJson === 'string' ? JSON.parse(p.colorsJson) : p.colorsJson) : [];
    const parsedColors: ColorVariantForm[] = Array.isArray(rawColors) ? rawColors.map((c: any) => {
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

    const rawMeta = p.mediaMetadata ? (typeof p.mediaMetadata === 'string' ? JSON.parse(p.mediaMetadata) : p.mediaMetadata) : [];
    const parsedMeta: ProductMediaItem[] = Array.isArray(rawMeta) && rawMeta.length > 0
      ? rawMeta
      : (p.images || []).map((url: string, idx: number) => ({
          url,
          sortOrder: idx,
          isMain: idx === 0,
          viewType: (idx === 0 ? "Front" : "Detail") as ImageViewType
        }));

    setFormData({
      name: p.name || "",
      sku: p.sku || "",
      brand: p.brand || "Tailoring Turba",
      price: String(p.basePrice || ""),
      minOrderQuantity: p.minOrderQuantity || 10,
      isActive: p.isActive !== false,
      badge: p.badge || "",
      shortDescription: p.shortDescription || "",
      description: p.description || "",
      features: p.features ? (Array.isArray(p.features) ? p.features.join("\n") : p.features) : "",
      
      department: p.department || "Apparel",
      category: p.category?.name || "Tops",
      newCategory: "",
      productType: p.productType || derivedPType || "Polo",
      style: p.style || "Classic Polo Collar",
      gender: p.gender || derivedG || "Men",
      qualityTier: p.qualityTier || derivedQ || "Standard",
      collection: p.collection || "Core Essentials",

      fabric: p.fabric || "100% Combed Cotton",
      fabricComposition: p.fabricComposition || "100% Combed Cotton",
      gsm: p.gsm ? String(p.gsm) : "220",
      fit: p.fit || "Regular",
      neckType: p.neckType || "Polo Collar",
      sleeveType: p.sleeveType || "Half Sleeve",
      pattern: p.pattern || "Solid / Plain",
      careInstructions: p.careInstructions || "Machine wash cold with like colors. Do not bleach. Tumble dry low. Warm iron if needed.",
      countryOfOrigin: p.countryOfOrigin || "India",

      sizes: Array.isArray(p.sizes) && p.sizes.length > 0 ? p.sizes : ["S", "M", "L", "XL", "2XL"],

      imageUrl: p.images && p.images[0] ? p.images[0] : "",
      imageUrls: p.images || [],
      mediaMetadata: parsedMeta,

      colors: p.colors ? String(p.colors) : "",
      colorsJson: parsedColors,

      seoTitle: p.seoTitle || "",
      seoDescription: p.seoDescription || "",
      seoKeywords: p.seoKeywords || "",
      slug: p.slug || generateSlug(p.name || ""),
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const finalSlug = generateSlug(formData.slug || formData.name);
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

      formData.colorsJson = normalizedColors;
    }

    setIsSubmitting(true);
    
    try {
      const submitData = {
        ...formData,
        slug: finalSlug,
        category: formData.category === "NEW" ? formData.newCategory : formData.category,
      };

      let res;
      if (editingProduct) {
        res = await fetch(`/api/admin/products/${editingProduct.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(submitData),
        });
      } else {
        res = await fetch("/api/admin/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(submitData),
        });
      }

      if (res.ok) {
        const updatedProduct = await res.json();
        if (editingProduct) {
          setProducts(products.map(p => p.id === editingProduct.id ? updatedProduct : p));
          toast.success("Product updated successfully!");
        } else {
          setProducts([updatedProduct, ...products]);
          toast.success("Product created successfully!");
        }
        setIsAdding(false);
        setEditingProduct(null);
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to save product");
      }
    } catch (e) {
      console.error(e);
      toast.error("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Product Catalog & Inventory</h1>
          <p className={styles.sub}>Manage product classifications, fabrics, size charts, media, and color variants</p>
        </div>
      </div>

      <div className={styles.actions}>
        <button 
          className={styles.addBtn}
          onClick={handleAddNewClick}
        >
          <Plus size={16} />
          {isAdding || editingProduct ? "Close Product Form" : "Add New Product"}
        </button>
      </div>

      {(isAdding || editingProduct) && (
        <div className={styles.formCard}>
          <h2 className={styles.formTitle}>
            {editingProduct ? `Edit Product: ${editingProduct.name}` : "Add New Product"}
          </h2>

          <form onSubmit={handleSubmit} className={styles.form}>
            
            {/* SECTION 1: BASIC INFORMATION */}
            <div className={styles.formSection}>
              <div className={styles.formSectionHeader}>
                <div className={styles.formSectionTitleGroup}>
                  <span className={styles.formSectionNumber}>1</span>
                  <h3 className={styles.formSectionTitle}>Basic Information</h3>
                </div>
                <p className={styles.formSectionDesc}>Core product identity, pricing, and descriptions</p>
              </div>

              <div className={styles.formRow}>
                <div className={styles.inputGroup}>
                  <label>Product Name *</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. Classic Polo (PIMA Cotton)"
                    value={formData.name}
                    onChange={(e) => {
                      const newName = e.target.value;
                      setFormData(prev => ({
                        ...prev,
                        name: newName,
                        slug: isSlugManuallyEdited ? prev.slug : generateSlug(newName)
                      }));
                    }}
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label>SKU (Stock Keeping Unit)</label>
                  <input 
                    type="text" 
                    placeholder="e.g. TT-POLO-PIMA-01"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  />
                </div>
              </div>

              <div className={styles.formRow3}>
                <div className={styles.inputGroup}>
                  <label>Base Price (₹) *</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. 475"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label>Min Order Qty (MOQ)</label>
                  <input 
                    type="number" 
                    min="1"
                    placeholder="10"
                    value={formData.minOrderQuantity}
                    onChange={(e) => setFormData({ ...formData, minOrderQuantity: parseInt(e.target.value) || 10 })}
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label>Brand</label>
                  <input 
                    type="text" 
                    placeholder="Tailoring Turba"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.inputGroup}>
                  <label>Status</label>
                  <select 
                    value={formData.isActive ? "active" : "offline"}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.value === "active" })}
                  >
                    <option value="active">Active (Live on Website)</option>
                    <option value="offline">Offline (Draft / Hidden)</option>
                  </select>
                </div>
                <div className={styles.inputGroup}>
                  <label>Badge / Highlight (Optional)</label>
                  <input 
                    type="text" 
                    placeholder="e.g. B2B Best Seller, Premium Quality, New"
                    value={formData.badge}
                    onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                  />
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label>Short Description (Catalog Summary)</label>
                <input 
                  type="text" 
                  placeholder="e.g. Luxury heavyweight 220 GSM PIMA cotton polo designed for corporate teams."
                  value={formData.shortDescription}
                  onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                />
              </div>

              <div className={styles.inputGroup}>
                <label>Full Description</label>
                <textarea 
                  rows={3} 
                  placeholder="Detailed product story, craftsmanship, and benefits..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className={styles.inputGroup}>
                <label>Bullet Features (One per line)</label>
                <textarea 
                  rows={3} 
                  placeholder="100% PIMA Combed Cotton&#10;Bio-Washed & Silicon Softened&#10;Reinforced Collar & 3-Button Placket&#10;Pre-Shrunk Fabric"
                  value={formData.features}
                  onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                />
              </div>
            </div>

            {/* SECTION 2: PRODUCT CLASSIFICATION */}
            <div className={styles.formSection}>
              <div className={styles.formSectionHeader}>
                <div className={styles.formSectionTitleGroup}>
                  <span className={styles.formSectionNumber}>2</span>
                  <h3 className={styles.formSectionTitle}>Product Classification</h3>
                </div>
                <p className={styles.formSectionDesc}>Categorization for Amazon/Myntra style multi-filtering</p>
              </div>

              <div className={styles.formRow4}>
                <div className={styles.inputGroup}>
                  <label>Department *</label>
                  <select 
                    value={formData.department}
                    onChange={(e) => {
                      const newDept = e.target.value;
                      const nextCats = CATEGORIES_BY_DEPARTMENT[newDept] || ["Tops"];
                      setFormData(prev => ({
                        ...prev,
                        department: newDept,
                        category: nextCats[0] || "Tops"
                      }));
                    }}
                  >
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>

                <div className={styles.inputGroup}>
                  <label>Category *</label>
                  <select 
                    value={formData.category}
                    onChange={(e) => {
                      const newCat = e.target.value;
                      const nextPtypes = PRODUCT_TYPES_BY_CATEGORY[newCat] || ALL_PRODUCT_TYPES;
                      setFormData(prev => ({
                        ...prev,
                        category: newCat,
                        productType: nextPtypes[0] || "Polo"
                      }));
                    }}
                  >
                    {availableCategories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className={styles.inputGroup}>
                  <label>Product Type *</label>
                  <select 
                    value={formData.productType}
                    onChange={(e) => {
                      const newPt = e.target.value;
                      const nextStyles = STYLES_BY_PRODUCT_TYPE[newPt] || ALL_STYLES;
                      setFormData(prev => ({
                        ...prev,
                        productType: newPt,
                        style: nextStyles[0] || "Classic"
                      }));
                    }}
                  >
                    {availableProductTypes.map(pt => <option key={pt} value={pt}>{pt}</option>)}
                  </select>
                </div>

                <div className={styles.inputGroup}>
                  <label>Style / Cut</label>
                  <select 
                    value={formData.style}
                    onChange={(e) => setFormData({ ...formData, style: e.target.value })}
                  >
                    {availableStyles.map(st => <option key={st} value={st}>{st}</option>)}
                  </select>
                </div>
              </div>

              <div className={styles.formRow3}>
                <div className={styles.inputGroup}>
                  <label>Gender *</label>
                  <select 
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  >
                    {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>

                <div className={styles.inputGroup}>
                  <label>Quality Tier</label>
                  <select 
                    value={formData.qualityTier}
                    onChange={(e) => setFormData({ ...formData, qualityTier: e.target.value })}
                  >
                    {QUALITY_TIERS.map(q => <option key={q} value={q}>{q}</option>)}
                  </select>
                </div>

                <div className={styles.inputGroup}>
                  <label>Collection / Season</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Core Essentials, Summer 2026, Luxe Line"
                    value={formData.collection}
                    onChange={(e) => setFormData({ ...formData, collection: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* SECTION 3: FABRIC & SPECIFICATIONS */}
            <div className={styles.formSection}>
              <div className={styles.formSectionHeader}>
                <div className={styles.formSectionTitleGroup}>
                  <span className={styles.formSectionNumber}>3</span>
                  <h3 className={styles.formSectionTitle}>Fabric & Specifications</h3>
                </div>
                <p className={styles.formSectionDesc}>Technical garment specifications and care parameters</p>
              </div>

              <div className={styles.formRow3}>
                <div className={styles.inputGroup}>
                  <label>Fabric Type</label>
                  <select 
                    value={formData.fabric}
                    onChange={(e) => setFormData({ ...formData, fabric: e.target.value })}
                  >
                    {FABRICS.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>

                <div className={styles.inputGroup}>
                  <label>Fabric Composition</label>
                  <input 
                    type="text" 
                    placeholder="e.g. 100% Combed Cotton or 95% Cotton, 5% Lycra"
                    value={formData.fabricComposition}
                    onChange={(e) => setFormData({ ...formData, fabricComposition: e.target.value })}
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label>GSM (Fabric Weight)</label>
                  <input 
                    type="number" 
                    placeholder="220"
                    value={formData.gsm}
                    onChange={(e) => setFormData({ ...formData, gsm: e.target.value })}
                  />
                </div>
              </div>

              <div className={styles.formRow4}>
                <div className={styles.inputGroup}>
                  <label>Fit</label>
                  <select 
                    value={formData.fit}
                    onChange={(e) => setFormData({ ...formData, fit: e.target.value })}
                  >
                    {FITS.map(fit => <option key={fit} value={fit}>{fit}</option>)}
                  </select>
                </div>

                <div className={styles.inputGroup}>
                  <label>Neck Type</label>
                  <select 
                    value={formData.neckType}
                    onChange={(e) => setFormData({ ...formData, neckType: e.target.value })}
                  >
                    {NECK_TYPES.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>

                <div className={styles.inputGroup}>
                  <label>Sleeve Type</label>
                  <select 
                    value={formData.sleeveType}
                    onChange={(e) => setFormData({ ...formData, sleeveType: e.target.value })}
                  >
                    {SLEEVE_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div className={styles.inputGroup}>
                  <label>Pattern</label>
                  <select 
                    value={formData.pattern}
                    onChange={(e) => setFormData({ ...formData, pattern: e.target.value })}
                  >
                    {PATTERNS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.inputGroup}>
                  <label>Care Instructions</label>
                  <input 
                    type="text" 
                    value={formData.careInstructions}
                    onChange={(e) => setFormData({ ...formData, careInstructions: e.target.value })}
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label>Country of Origin</label>
                  <input 
                    type="text" 
                    value={formData.countryOfOrigin}
                    onChange={(e) => setFormData({ ...formData, countryOfOrigin: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* SECTION 4: AVAILABLE SIZES */}
            <div className={styles.formSection}>
              <div className={styles.formSectionHeader}>
                <div className={styles.formSectionTitleGroup}>
                  <span className={styles.formSectionNumber}>4</span>
                  <h3 className={styles.formSectionTitle}>Available Sizes</h3>
                </div>
                <p className={styles.formSectionDesc}>Select which sizes are available for order on this product</p>
              </div>

              <div className={styles.sizeChipsContainer}>
                {STANDARD_SIZES.map(size => {
                  const isSelected = formData.sizes.includes(size);
                  return (
                    <button
                      key={size}
                      type="button"
                      className={`${styles.sizeChipBtn} ${isSelected ? styles.sizeChipBtnActive : ""}`}
                      onClick={() => handleToggleSize(size)}
                    >
                      {isSelected ? <Check size={14} /> : null}
                      {size}
                    </button>
                  );
                })}
                {/* Custom sizes already selected */}
                {formData.sizes.filter(s => !(STANDARD_SIZES as readonly string[]).includes(s)).map(custom => (
                  <button
                    key={custom}
                    type="button"
                    className={`${styles.sizeChipBtn} ${styles.sizeChipBtnActive}`}
                    onClick={() => handleToggleSize(custom)}
                  >
                    <Check size={14} />
                    {custom}
                  </button>
                ))}
              </div>

              <div style={{ display: "flex", gap: "8px", alignItems: "center", maxWidth: "320px", marginTop: "8px" }}>
                <input 
                  type="text"
                  placeholder="Custom size (e.g. 5XL, Free Size)"
                  value={customSizeInput}
                  onChange={(e) => setCustomSizeInput(e.target.value)}
                  style={{ padding: "8px 12px", fontSize: "0.85rem" }}
                />
                <button 
                  type="button"
                  onClick={handleAddCustomSize}
                  className={styles.mediaReorderBtn}
                  style={{ padding: "8px 14px", height: "100%", whiteSpace: "nowrap" }}
                >
                  + Add Size
                </button>
              </div>
            </div>

            {/* SECTION 5: PRODUCT MEDIA (MAX 6) */}
            <div className={styles.formSection}>
              <div className={styles.formSectionHeader}>
                <div className={styles.formSectionTitleGroup}>
                  <span className={styles.formSectionNumber}>5</span>
                  <h3 className={styles.formSectionTitle}>Product Media & Gallery</h3>
                </div>
                <p className={styles.formSectionDesc}>
                  Upload up to 6 high-res product photos ({formData.imageUrls.length}/6 uploaded)
                </p>
              </div>

              <div className={styles.mediaGrid}>
                {formData.imageUrls.map((url, idx) => {
                  const meta = formData.mediaMetadata[idx] || { viewType: idx === 0 ? "Front" : "Detail" };
                  return (
                    <div key={idx} className={styles.mediaCard}>
                      <div className={styles.mediaCardImgWrap}>
                        <img 
                          src={getResizedCloudinaryUrl(url, 200, 200)}
                          alt={`Photo ${idx + 1}`}
                          className={styles.mediaCardImg}
                        />
                        {idx === 0 && <span className={styles.mediaMainBadge}>MAIN</span>}
                        <button 
                          type="button"
                          className={styles.mediaDeleteBtn}
                          onClick={() => handleRemoveImage(idx)}
                          title="Delete image"
                        >
                          <X size={12} />
                        </button>
                      </div>

                      <div className={styles.mediaCardControls}>
                        <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#0f172a" }}>Photo {idx + 1}</span>
                        <select 
                          className={styles.mediaViewSelect}
                          value={meta.viewType || "Detail"}
                          onChange={(e) => handleUpdateViewType(idx, e.target.value as ImageViewType)}
                        >
                          {IMAGE_VIEW_TYPES.map(vt => <option key={vt} value={vt}>{vt}</option>)}
                        </select>

                        <div className={styles.mediaReorderRow}>
                          <button
                            type="button"
                            className={styles.mediaReorderBtn}
                            disabled={idx === 0}
                            onClick={() => handleMoveImage(idx, 'left')}
                            title="Move Left"
                          >
                            <ArrowLeft size={12} />
                          </button>
                          {idx !== 0 && (
                            <button
                              type="button"
                              className={styles.mediaSetMainBtn}
                              onClick={() => handleSetMainImage(idx)}
                            >
                              Make Main
                            </button>
                          )}
                          <button
                            type="button"
                            className={styles.mediaReorderBtn}
                            disabled={idx === formData.imageUrls.length - 1}
                            onClick={() => handleMoveImage(idx, 'right')}
                            title="Move Right"
                          >
                            <ArrowRight size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {formData.imageUrls.length < 6 && (
                  <label className={styles.uploadSlot} style={{ minHeight: "190px" }}>
                    <input 
                      type="file" 
                      accept="image/*" 
                      multiple 
                      onChange={handleUpload}
                      disabled={isUploading}
                    />
                    {isUploading ? (
                      <Loader2 className={styles.spinner} size={24} />
                    ) : (
                      <>
                        <Plus size={24} />
                        <span>Upload Photo</span>
                      </>
                    )}
                  </label>
                )}
              </div>
            </div>

            {/* SECTION 6: AVAILABLE COLORS & MULTI-PHOTO MAPPING */}
            <div className={styles.formSection}>
              <div className={styles.formSectionHeader}>
                <div className={styles.formSectionTitleGroup}>
                  <span className={styles.formSectionNumber}>6</span>
                  <h3 className={styles.formSectionTitle}>Available Colors & Variant Mapping</h3>
                </div>
                <p className={styles.formSectionDesc}>
                  {formData.colorsJson.length} {formData.colorsJson.length === 1 ? "color" : "colors"} configured
                </p>
              </div>

              {/* Sticky Photo Reference Bar */}
              {formData.imageUrls.length > 0 && (
                <div className={styles.stickyPhotoRefToolbar}>
                  <div className={styles.stickyPhotoRefHeader}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <ImageIcon size={14} color="var(--tth-navy)" />
                      <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--tth-navy)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        Product Photos Reference
                      </span>
                    </div>
                    <span style={{ fontSize: "0.72rem", color: "var(--tth-text-muted)" }}>
                      {formData.imageUrls.length} photos available • Hover thumbnail to inspect
                    </span>
                  </div>

                  <div className={styles.stickyPhotoRefList}>
                    {formData.imageUrls.map((url, imgIdx) => {
                      const mappedColors = (formData.colorsJson || []).filter(c => (c.imageUrls || []).includes(url) || c.image === url);
                      return (
                        <div key={imgIdx} className={styles.stickyPhotoRefItem}>
                          <div className={styles.stickyPhotoThumbWrap}>
                            <img
                              src={getResizedCloudinaryUrl(url, 100, 100)}
                              alt={`Photo ${imgIdx + 1}`}
                              className={styles.stickyPhotoThumb}
                            />
                            <div className={styles.stickyPhotoPreviewTooltip}>
                              <div className={styles.tooltipHeader}>
                                <span>Photo {imgIdx + 1}</span>
                                {imgIdx === 0 && <span className={styles.tooltipMainBadge}>Main</span>}
                              </div>
                              <img
                                src={getResizedCloudinaryUrl(url, 400, 400)}
                                alt={`Photo ${imgIdx + 1} Preview`}
                                className={styles.tooltipImg}
                              />
                              {mappedColors.length > 0 && (
                                <div className={styles.tooltipAssignedColors}>
                                  <span style={{ fontSize: "0.7rem", color: "#64748b" }}>Mapped to:</span>
                                  {mappedColors.map((mc, mci) => (
                                    <span key={mci} className={styles.tooltipColorPill}>
                                      <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: mc.value || "#000", display: "inline-block" }} />
                                      {mc.name || `Color #${mci + 1}`}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className={styles.stickyPhotoMeta}>
                            <span className={styles.stickyPhotoLabel}>Photo {imgIdx + 1}</span>
                            {mappedColors.length > 0 ? (
                              <div className={styles.stickyPhotoAssignedList}>
                                {mappedColors.map((mc, mci) => (
                                  <span key={mci} className={styles.assignedBadge} title={`Mapped to ${mc.name}`}>
                                    <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: mc.value || "#000", display: "inline-block", flexShrink: 0 }} />
                                    {mc.name}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className={styles.unassignedBadge}>Unmapped</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Color rows */}
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
                        gap: "8px", 
                        background: "var(--tth-offwhite)", 
                        padding: "14px", 
                        borderRadius: "8px",
                        border: isHexValid ? "1px solid var(--tth-beige-light)" : "1.5px solid #fca5a5"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", width: "100%" }}>
                        {/* Native Color Picker Swatch */}
                        <div style={{ position: "relative", width: "36px", height: "36px", flexShrink: 0 }}>
                          <input 
                            type="color"
                            value={normalizedValue}
                            onChange={(e) => {
                              const newHex = e.target.value.toUpperCase();
                              const newColors = [...formData.colorsJson];
                              const oldName = newColors[index].name;
                              const suggested = suggestColorName(newHex);
                              newColors[index] = {
                                ...newColors[index],
                                value: newHex,
                                hex: newHex,
                                name: (!oldName || oldName.startsWith("Color #")) ? suggested : oldName
                              };
                              setFormData({ ...formData, colorsJson: newColors });
                            }}
                            style={{
                              position: "absolute",
                              top: 0,
                              left: 0,
                              width: "100%",
                              height: "100%",
                              opacity: 0,
                              cursor: "pointer",
                              zIndex: 2,
                            }}
                            title="Click to open color picker"
                          />
                          <div 
                            style={{
                              width: "100%",
                              height: "100%",
                              borderRadius: "6px",
                              backgroundColor: normalizedValue,
                              border: "2px solid #ffffff",
                              boxShadow: "0 0 0 1px #cbd5e1",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center"
                            }}
                          />
                        </div>

                        {/* HEX input */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px", width: "110px" }}>
                          <input 
                            type="text" 
                            placeholder="#000000"
                            value={color.value}
                            onChange={(e) => {
                              const newColors = [...formData.colorsJson];
                              const rawInput = e.target.value;
                              newColors[index] = {
                                ...newColors[index],
                                value: rawInput,
                                hex: isValidHex(rawInput) ? normalizeHex(rawInput) : rawInput
                              };
                              setFormData({ ...formData, colorsJson: newColors });
                            }}
                            style={{ 
                              padding: "8px 10px", 
                              fontSize: "0.85rem",
                              fontFamily: "monospace",
                              textTransform: "uppercase",
                              background: isHexValid ? "white" : "#fff1f2",
                              borderColor: isHexValid ? "var(--tth-beige-light)" : "#f43f5e"
                            }}
                          />
                        </div>

                        {/* Color Name */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px", flex: 1, minWidth: "150px" }}>
                          <input 
                            type="text" 
                            placeholder="Color Name (e.g. Navy Blue)"
                            value={color.name}
                            onChange={(e) => {
                              const newColors = [...formData.colorsJson];
                              newColors[index].name = e.target.value;
                              setFormData({ ...formData, colorsJson: newColors });
                            }}
                            style={{ padding: "8px 10px", fontSize: "0.85rem", background: "white" }}
                          />
                        </div>

                        {/* Auto-suggest button */}
                        <button
                          type="button"
                          onClick={() => {
                            if (isHexValid) {
                              const suggested = suggestColorName(color.value);
                              const newColors = [...formData.colorsJson];
                              newColors[index].name = suggested;
                              setFormData({ ...formData, colorsJson: newColors });
                              toast.success(`Name set to "${suggested}"`);
                            }
                          }}
                          style={{
                            background: "none",
                            border: "1px solid #cbd5e1",
                            borderRadius: "4px",
                            padding: "6px 8px",
                            fontSize: "0.75rem",
                            cursor: "pointer",
                            color: "#475569",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px"
                          }}
                          title="Auto-detect color name from HEX"
                        >
                          <Sparkles size={12} /> Name
                        </button>

                        {/* Delete color row */}
                        <button 
                          type="button" 
                          onClick={() => {
                            const newColors = formData.colorsJson.filter((_, i) => i !== index);
                            setFormData({ ...formData, colorsJson: newColors });
                          }}
                          style={{ 
                            background: "none", 
                            border: "none", 
                            color: "#ef4444", 
                            cursor: "pointer", 
                            padding: "6px",
                            borderRadius: "4px",
                            display: "flex",
                            alignItems: "center"
                          }}
                          title="Remove Color"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      {/* Multi-Photo Mapping Chips */}
                      {formData.imageUrls.length > 0 && (
                        <div style={{ marginTop: "4px", borderTop: "1px dashed rgba(0,0,0,0.08)", paddingTop: "8px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                            <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#475569" }}>
                              Mapped Gallery Photos ({color.imageUrls?.length || 0} selected):
                            </span>
                            <span style={{ fontSize: "0.7rem", color: "#94a3b8" }}>
                              Click photos to assign to {color.name || "this color"}
                            </span>
                          </div>

                          <div className={styles.photoMapChips}>
                            {formData.imageUrls.map((url, imgIdx) => {
                              const isMapped = (color.imageUrls || []).includes(url) || color.image === url;
                              return (
                                <button
                                  key={imgIdx}
                                  type="button"
                                  className={`${styles.photoMapChip} ${isMapped ? styles.photoMapChipSelected : ""}`}
                                  onClick={() => {
                                    const currentMapped = color.imageUrls || [];
                                    const newMapped = isMapped
                                      ? currentMapped.filter(u => u !== url)
                                      : [...currentMapped, url];
                                    
                                    const newColors = [...formData.colorsJson];
                                    newColors[index] = {
                                      ...newColors[index],
                                      imageUrls: newMapped,
                                      image: newMapped[0] || "",
                                      imageUrl: newMapped[0] || ""
                                    };
                                    setFormData({ ...formData, colorsJson: newColors });
                                  }}
                                >
                                  <img 
                                    src={getResizedCloudinaryUrl(url, 50, 50)} 
                                    alt={`Photo ${imgIdx + 1}`}
                                    className={styles.photoMapChipThumb}
                                  />
                                  <span>{isMapped ? `✓ Photo ${imgIdx + 1}` : `Photo ${imgIdx + 1}`}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Add Color Button */}
              <button 
                type="button" 
                onClick={() => {
                  const defaultHex = "#000000";
                  const suggested = suggestColorName(defaultHex);
                  setFormData({
                    ...formData,
                    colorsJson: [
                      ...(formData.colorsJson || []),
                      { name: suggested, value: defaultHex, hex: defaultHex, imageUrls: [], image: "" }
                    ]
                  });
                }}
                style={{
                  background: "#ffffff",
                  border: "1.5px dashed var(--tth-olive-dark)",
                  borderRadius: "6px",
                  padding: "10px",
                  color: "var(--tth-olive-dark)",
                  fontWeight: 700,
                  fontSize: "0.8rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  transition: "background 0.2s"
                }}
              >
                <Plus size={14} /> Add Color Variant
              </button>
            </div>

            {/* SECTION 7: SEO OPTIMIZATION */}
            <div className={styles.formSection}>
              <div className={styles.formSectionHeader}>
                <div className={styles.formSectionTitleGroup}>
                  <span className={styles.formSectionNumber}>7</span>
                  <h3 className={styles.formSectionTitle}>Search Engine Optimization (SEO)</h3>
                </div>
                <button
                  type="button"
                  onClick={handleAutoGenerateSeo}
                  className={styles.autoSeoBtn}
                >
                  <Sparkles size={14} /> Auto-Generate SEO
                </button>
              </div>

              <div className={styles.inputGroup}>
                <label>Page Meta Title</label>
                <input 
                  type="text" 
                  value={formData.seoTitle}
                  placeholder="e.g. Classic Polo | Bulk PIMA Cotton Manufacturer India | Tailoring Turba"
                  onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
                />
              </div>

              <div className={styles.inputGroup}>
                <label>Meta Description</label>
                <textarea 
                  rows={2}
                  value={formData.seoDescription}
                  placeholder="Compelling search summary under 160 characters..."
                  onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })}
                />
              </div>

              <div className={styles.inputGroup}>
                <label>Keywords (Comma separated)</label>
                <input 
                  type="text" 
                  value={formData.seoKeywords}
                  placeholder="bulk polo manufacturer, corporate apparel India, wholesale uniforms"
                  onChange={(e) => setFormData({ ...formData, seoKeywords: e.target.value })}
                />
              </div>

              <div className={styles.inputGroup}>
                <label>URL Slug / Handle *</label>
                <div className={styles.slugInputWrapper}>
                  <span className={styles.slugPrefix}>/products/</span>
                  <input 
                    type="text" 
                    required 
                    value={formData.slug}
                    onChange={(e) => {
                      setIsSlugManuallyEdited(true);
                      setFormData({ ...formData, slug: e.target.value });
                    }}
                    className={styles.slugInput}
                  />
                </div>
              </div>
            </div>

            <button type="submit" disabled={isSubmitting} className={styles.submitBtn}>
              {isSubmitting ? "Saving Product..." : editingProduct ? "Update Product" : "Publish Product"}
            </button>
          </form>
        </div>
      )}

      {/* PRODUCTS TABLE */}
      <div className={styles.tableBlock}>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Product</th>
                <th>Classification</th>
                <th>Fabric & GSM</th>
                <th>Price</th>
                <th>Colors</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const productType = deriveProductType(p);
                const gender = deriveGender(p);
                const quality = deriveQualityTier(p);
                const colorsCount = p.colorsJson 
                  ? (Array.isArray(p.colorsJson) ? p.colorsJson.length : (typeof p.colorsJson === 'string' ? JSON.parse(p.colorsJson).length : (p.colors || 0)))
                  : (p.colors || 0);

                return (
                  <tr key={p.id}>
                    <td className={styles.productCell}>
                      <div className={styles.imageThumbnail}>
                        {p.images && p.images[0] ? (
                          <img
                            src={getResizedCloudinaryUrl(p.images[0], 100, 100)}
                            alt={p.name}
                            className={styles.image}
                          />
                        ) : (
                          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#f1f5f9" }}>
                            <ImageIcon size={18} color="#94a3b8" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.9rem" }}>{p.name}</div>
                        <div style={{ fontSize: "0.75rem", color: "#64748b" }}>SKU: {p.sku || `TT-${p.id}`}</div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                        <span style={{ fontWeight: 600, fontSize: "0.8rem", color: "#1e293b" }}>{productType} • {gender}</span>
                        <span style={{ fontSize: "0.72rem", color: "#64748b" }}>{p.category?.name || "Tops"} • {quality}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: "0.8rem", color: "#334155" }}>
                        <div>{p.fabric || "Cotton"}</div>
                        <div style={{ fontSize: "0.72rem", color: "#64748b" }}>{p.gsm ? `${p.gsm} GSM` : "Standard Weight"}</div>
                      </div>
                    </td>
                    <td style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.9rem" }}>
                      ₹{p.basePrice}
                    </td>
                    <td>
                      <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#334155" }}>
                        {colorsCount} {colorsCount === 1 ? "color" : "colors"}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => handleToggleActive(p)}
                        style={{
                          background: p.isActive !== false ? "#dcfce7" : "#fee2e2",
                          color: p.isActive !== false ? "#15803d" : "#b91c1c",
                          border: "none",
                          padding: "4px 8px",
                          borderRadius: "4px",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          cursor: "pointer"
                        }}
                      >
                        {p.isActive !== false ? "Active" : "Offline"}
                      </button>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          onClick={() => handleEditClick(p)}
                          style={{
                            background: "none",
                            border: "1px solid #cbd5e1",
                            padding: "6px 10px",
                            borderRadius: "4px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            color: "#334155"
                          }}
                        >
                          <Edit2 size={12} /> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          disabled={isDeleting === p.id}
                          style={{
                            background: "none",
                            border: "1px solid #fca5a5",
                            padding: "6px",
                            borderRadius: "4px",
                            cursor: "pointer",
                            color: "#dc2626"
                          }}
                          title="Delete Product"
                        >
                          {isDeleting === p.id ? <Loader2 className={styles.spinner} size={14} /> : <Trash2 size={14} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
