"use client";
import { useState, useEffect, useRef, Suspense, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import PoloCustomizer from "@/components/customizer/PoloCustomizer";
import { CustomizerState, Side } from "@/types/customizer";
import styles from "./page.module.css";
import { X, Undo2, Redo2, Eye, EyeOff, UploadCloud, FileText, Trash2, Palette, Ruler, Shield, Truck } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import SizeBreakdown from "@/components/customizer/SizeBreakdown";
import OrderSummary from "@/components/customizer/OrderSummary";
import { allProducts } from "@/lib/products-data";
import { getProductColors } from "@/lib/customizer-utils";
import Image from "next/image";

function CustomizerContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"Design" | "Options" | "Review">("Design");
  const [customizerState, setCustomizerState] = useState<CustomizerState | null>(null);
  const [activeSide, setActiveSide] = useState<Side>("front");
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [productionFiles, setProductionFiles] = useState<{name: string, size: number, url: string}[]>([]);
  const [toast, setToast] = useState<{message: string, visible: boolean, type: 'info' | 'error' | 'success' | 'warning'}>({message: "", visible: false, type: 'info'});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addToCart } = useCart();
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [dbProduct, setDbProduct] = useState<any>(null);
  const [isLoadingProduct, setIsLoadingProduct] = useState(true);

  const synchronizedColors = useMemo(() => {
    if (!dbProduct) return undefined;
    return dbProduct.availableColors || getProductColors(dbProduct.name, dbProduct.description, dbProduct.features || [], dbProduct.colors);
  }, [dbProduct]);

  const productId = searchParams.get('id') || searchParams.get('productId');
  const designId = searchParams.get('designId');

  useEffect(() => {
    if (designId) {
      const fetchDesign = async () => {
        try {
          const res = await fetch(`/api/designs/${designId}`);
          if (!res.ok) throw new Error("Design not found");
          const data = await res.json();
          let state = typeof data.stateJson === 'string' ? JSON.parse(data.stateJson) : data.stateJson;
          setCustomizerState(state);
          
          if (data.sourceProductId) {
            const pRes = await fetch(`/api/products/${data.sourceProductId}`);
            if (pRes.ok) {
               setDbProduct(await pRes.json());
            } else {
               const staticMatch = allProducts.find(p => String(p.id) === String(data.sourceProductId));
               if (staticMatch) setDbProduct(staticMatch);
            }
          }
        } catch (err) {
          console.error("Failed to fetch design:", err);
        } finally {
          setIsLoadingProduct(false);
        }
      };
      fetchDesign();
      return;
    }

    if (!productId) {
      setIsLoadingProduct(false);
      return;
    }

    const fetchProduct = async () => {
      try {
        const res = await fetch(`/api/products/${productId}`);
        if (!res.ok) throw new Error("Product not found");
        const data = await res.json();
        setDbProduct(data);
      } catch (err) {
        console.error("Failed to fetch product for customizer:", err);
        // Fallback to static data if available
        const staticMatch = allProducts.find(p => String(p.id) === String(productId));
        if (staticMatch) setDbProduct(staticMatch);
      } finally {
        setIsLoadingProduct(false);
      }
    };

    fetchProduct();
  }, [productId, designId]);

  // Map product type/category/name to design studio garment type.
  // Priority: type field (most precise) → name → category → default.
  const categoryToGarment = (category: string, name?: string, type?: string): string => {
    const lowerType = (type || '').toLowerCase();
    const lowerName = (name || '').toLowerCase();

    // 1. Check the product's type field first — most reliable
    if (lowerType.includes('round neck') || lowerType.includes('crew neck') || lowerType.includes('crewneck')) return 'round-neck';
    if (lowerType.startsWith('polo') || lowerType.includes('· polo') || lowerType.includes('polo ·')) return 'polo';
    if (lowerType.includes('hoodie')) return 'hoodie';
    if (lowerType.includes('jacket')) return 'hoodie';

    // 2. Fall back to product name
    if (lowerName.includes('polo')) return 'polo';
    if (lowerName.includes('hoodie')) return 'hoodie';
    if (lowerName.includes('jacket')) return 'hoodie';
    if (lowerName.includes('round neck') || lowerName.includes('crew neck') || lowerName.includes('crewneck')) return 'round-neck';

    // 3. Fall back to category
    const map: Record<string, string> = {
      'Crewnecks': 'round-neck',
      'Hoodies': 'hoodie',
      'Jackets': 'hoodie',
      'Polos': 'polo',
      'Crop Tops': 'round-neck',
      'Oversized': 'round-neck',
      'T-Shirts': 'round-neck',
      'Uniforms': 'polo',
      'Formal Wear': 'polo',
    };
    return map[category || ''] || 'round-neck';
  };

  useEffect(() => {
    const garment = searchParams.get('garment');
    const fabricId = searchParams.get('fabricId');
    const derivedGarment = dbProduct 
      ? categoryToGarment(dbProduct.category?.name || dbProduct.category, dbProduct.name, dbProduct.type) 
      : (garment || 'round-neck');
    
    // Only set initial state once
    if (!customizerState) {
      setCustomizerState({
        garmentType: derivedGarment,
        bodyColor: 'transparent',
        frontElements: [],
        backElements: [],
        leftElements: [],
        rightElements: [],
        fabricId: fabricId || undefined,
        sizes: { S: 0, M: 0, L: 0, XL: 0, XXL: 0 }
      });
    } else if (dbProduct && customizerState.garmentType !== derivedGarment) {
      // Update garment type if it changes from product selection
      setCustomizerState(prev => prev ? ({ ...prev, garmentType: derivedGarment }) : null);
    }
  }, [searchParams, dbProduct]);

  useEffect(() => {
    // Mark as unsaved whenever customizerState changes after initial load
    if (customizerState) {
      setHasUnsavedChanges(true);
    }
  }, [customizerState?.frontElements, customizerState?.backElements, customizerState?.leftElements, customizerState?.rightElements, customizerState?.bodyColor, customizerState?.garmentType]);

  useEffect(() => {
    const handleBounds = (e: any) => {
      setCanUndo(e.detail.canUndo);
      setCanRedo(e.detail.canRedo);
    };
    window.addEventListener('history-bounds', handleBounds);
    return () => window.removeEventListener('history-bounds', handleBounds);
  }, []);

  const totalQuantity = customizerState?.sizes 
    ? Object.values(customizerState.sizes).reduce((a, b) => a + (b || 0), 0) 
    : 0;

  // True if the customer has placed ANY logo/image element on any side
  const hasLogoElements = (
    (customizerState?.frontElements || []).some(el => el.type === "logo") ||
    (customizerState?.backElements  || []).some(el => el.type === "logo") ||
    (customizerState?.leftElements  || []).some(el => el.type === "logo") ||
    (customizerState?.rightElements || []).some(el => el.type === "logo")
  );

  // Check if ALL logo elements are from "Your Uploads" (already on Cloudinary/server)
  const allLogosFromUploads = hasLogoElements && [
    ...(customizerState?.frontElements || []).filter(el => el.type === "logo"),
    ...(customizerState?.backElements  || []).filter(el => el.type === "logo"),
    ...(customizerState?.leftElements  || []).filter(el => el.type === "logo"),
    ...(customizerState?.rightElements || []).filter(el => el.type === "logo"),
  ].every(el => el.value && (el.value.includes('res.cloudinary.com') || el.value.includes('cloudinary')));

  // Production asset gate: required only when logos are present AND they weren't from existing uploads
  const needsProductionAsset = hasLogoElements && !allLogosFromUploads && productionFiles.length === 0;

  const showToast = (message: string, type: 'info' | 'error' | 'success' = 'info') => {
    setToast({ message, visible: true, type });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
  };

  const [isUploadingAssets, setIsUploadingAssets] = useState(false);

  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });
    if (!res.ok) throw new Error("Upload failed");
    return await res.json();
  };

  const handleNext = async () => {
    if (activeTab === "Design") {
      setActiveTab("Options");
      setIsPreviewMode(false);
    } else if (activeTab === "Options") {
      if (totalQuantity < MOQ) {
        showToast(`Minimum order quantity is ${MOQ} pieces. Please add more sizes.`, "error");
        return;
      }
      if (needsProductionAsset) {
        showToast("Please upload at least one production asset file before proceeding.", "info");
        // Scroll the production assets section into view
        document.getElementById("production-assets-section")?.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
      setActiveTab("Review");
      setIsPreviewMode(false);
    } else {
      if (isUploadingAssets) {
        showToast("Please wait for your assets to finish uploading.", "info");
        return;
      }
      if (!customizerState || totalQuantity === 0) {
        showToast("Please add at least one garment size to proceed.", "error");
        return;
      }
      if (needsProductionAsset) {
        showToast("Please upload at least one production asset file before adding to cart.", "info");
        setActiveTab("Options");
        setTimeout(() => document.getElementById("production-assets-section")?.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
        return;
      }
      
      setIsSaving(true);
      try {
        // Capture Mockup
        let mockupUrl = "";
        let mockupUrlBack = "";
        let mockupUrlLeft = "";
        let mockupUrlRight = "";
        
        try {
          const html2canvas = (await import("html2canvas")).default;
          
          const captureId = async (id: string, fileName: string) => {
            const element = document.getElementById(id);
            if (!element) return "";
            
            // Ensure any images in the mockup area are loaded
            const images = element.getElementsByTagName("img");
            await Promise.all(Array.from(images).map(img => {
              if (img.complete) return Promise.resolve();
              return new Promise(resolve => { img.onload = resolve; img.onerror = resolve; });
            }));

            const canvas = await html2canvas(element, {
              useCORS: true,
              backgroundColor: null,
              scale: 2,
              logging: false
            });
            const blob = await new Promise<Blob>((resolve) => canvas.toBlob(b => resolve(b!), "image/png"));
            const mockupFile = new File([blob], fileName, { type: "image/png" });
            const uploadRes = await uploadFile(mockupFile);
            return uploadRes.url;
          };

          // Capture front from review preview
          mockupUrl = await captureId("review-mockup-front", "mockup_front.png");
          
          // Capture back from review preview if it has elements
          if (customizerState.backElements.length > 0) {
            mockupUrlBack = await captureId("review-mockup-back", "mockup_back.png");
          }
          if (customizerState.leftElements.length > 0) {
            mockupUrlLeft = await captureId("review-mockup-left", "mockup_left.png");
          }
          if (customizerState.rightElements.length > 0) {
            mockupUrlRight = await captureId("review-mockup-right", "mockup_right.png");
          }

        } catch (err) {
          console.error("Failed to capture mockup:", err);
        }

        const rawPrice = dbProduct?.basePrice || dbProduct?.price || 85;
        const basePrice = typeof rawPrice === 'number' ? rawPrice : parseFloat(String(rawPrice).replace(/[^\d.]/g, '')) || 85;

        // Add to cart
        addToCart({
          id: `custom-${Date.now()}`,
          productId: dbProduct?.id || "",
          code: "CUSTOM-DESIGN",
          name: dbProduct ? `Custom ${dbProduct.name}` : `Custom ${customizerState.garmentType.replace(/-/g, ' ')}`,
          price: basePrice, 
          quantity: totalQuantity,
          image: mockupUrl || dbProduct?.images?.[0] || dbProduct?.image,
          mockupUrlBack: mockupUrlBack, // Save the back mockup
          mockupUrlLeft: mockupUrlLeft, // Save the left mockup
          mockupUrlRight: mockupUrlRight, // Save the right mockup
          customDesign: customizerState,
          uploadedAssets: productionFiles.map(f => f.url),
        });
        router.push('/cart');
      } catch (err) {
        showToast("Failed to process order assets. Please try again.", "error");
      } finally {
        setIsSaving(false);
      }
    }
  };

  const nextText = activeTab === "Design" ? "Next: Options" : activeTab === "Options" ? "Next: Review" : (isSaving || isUploadingAssets) ? "Processing..." : "Add to Cart";

  const handleSizeChange = (size: string, qty: number) => {
    if (!customizerState) return;
    setCustomizerState({
      ...customizerState,
      sizes: {
        ...customizerState.sizes,
        [size]: Math.max(0, qty)
      }
    });
  };

  const MOQ = Math.max(dbProduct?.minOrderQuantity || 0, 10);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setIsUploadingAssets(true);
      showToast("Uploading production assets...", "info");
      
      for (const file of files) {
        try {
          const res = await uploadFile(file);
          setProductionFiles(prev => [...prev, {
            name: file.name,
            size: file.size,
            url: res.url
          }]);
        } catch (err) {
          showToast(`Failed to upload ${file.name}`, "error");
        }
      }
      setIsUploadingAssets(false);
    }
  };

  const removeFile = (index: number) => {
    setProductionFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveDesign = async () => {
    if (!customizerState) return;
    
    setIsSaving(true);
    try {
      // Check auth status
      const authRes = await fetch('/api/auth/session');
      const session = await authRes.json();
      
      if (!session || !Object.keys(session).length || !session.user) {
        showToast("Please login to save your design to your account.", "error");
        setIsSaving(false);
        // Could also store in localStorage here for guest users
        return;
      }

      const res = await fetch('/api/designs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `Custom ${customizerState.garmentType.replace(/-/g, ' ')}`,
          stateJson: customizerState,
          sourceProductId: dbProduct?.id || null,
        })
      });

      if (!res.ok) throw new Error("Failed to save design");
      
      setHasUnsavedChanges(false);
      showToast("Design saved to your account!", "success");
    } catch (err) {
      console.error(err);
      showToast("An error occurred while saving the design.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className={styles.appLayout}>
      {/* Top App Bar (Zazzle-style) */}
      <header className={styles.topBar}>
        <div className={styles.topBarLeft}>
          <button 
            className={styles.exitBtn} 
            onClick={() => {
              const dest = dbProduct ? `/products/${dbProduct.id}` : '/';
              window.location.href = dest;
            }}
          >
            <X size={18} /> {dbProduct ? 'Back to Product' : 'Exit'}
          </button>
          <div className={styles.productName}>
            {dbProduct ? dbProduct.name : 'Custom Design'}
          </div>
          {dbProduct && (
            <div style={{ fontSize: '0.75rem', color: '#888', fontFamily: 'var(--font-sans)', background: '#f5f5f5', padding: '4px 10px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--tth-olive-dark)', display: 'inline-block' }} />
              {dbProduct.type || dbProduct.category?.name}
            </div>
          )}
          <button 
            onClick={handleSaveDesign}
            disabled={isSaving}
            style={{ 
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              cursor: isSaving ? 'not-allowed' : 'pointer', 
              border: hasUnsavedChanges ? '1.5px solid var(--tth-olive-dark)' : '1.5px solid #e5e5e5',
              background: hasUnsavedChanges ? 'var(--tth-olive-dark)' : '#f1f5f9',
              color: hasUnsavedChanges ? 'white' : '#64748b',
              padding: '7px 16px',
              borderRadius: '6px',
              fontSize: '0.8rem',
              fontWeight: 700,
              letterSpacing: '0.04em',
              opacity: isSaving ? 0.7 : 1,
              transition: 'all 0.2s',
              fontFamily: 'var(--font-sans)',
            }}
          >
            {isSaving ? (
              <>Saving...</>
            ) : hasUnsavedChanges ? (
              <>Save Design</>
            ) : (
              <>Saved ✓</>
            )}
          </button>
        </div>

        <div className={styles.topBarCenter}>
          <button 
            className={`${styles.tab} ${activeTab === "Design" ? styles.tabActive : ""}`}
            onClick={() => {
              setActiveTab("Design");
              setIsPreviewMode(false);
            }}
          >
            Design
          </button>
          <button 
            className={`${styles.tab} ${activeTab === "Options" ? styles.tabActive : ""}`}
            onClick={() => {
              setActiveTab("Options");
              setIsPreviewMode(false);
            }}
          >
            Options
          </button>
          <button 
            className={`${styles.tab} ${activeTab === "Review" ? styles.tabActive : ""}`}
            onClick={() => {
              if (totalQuantity === 0 && activeTab !== "Review") {
                showToast("Please add at least one garment size to proceed.", "error");
                setActiveTab("Options");
                setIsPreviewMode(false);
                return;
              }
              setActiveTab("Review");
              setIsPreviewMode(false);
            }}
          >
            Review
          </button>
        </div>

        <div className={styles.topBarRight}>
          <div className={styles.actionIcons}>
            <button className={styles.iconBtn} title="Undo" onClick={() => window.dispatchEvent(new CustomEvent('undo-customizer'))} style={{ opacity: canUndo ? 1 : 0.4, cursor: canUndo ? 'pointer' : 'default' }} disabled={!canUndo}><Undo2 size={16} /></button>
            <button className={styles.iconBtn} title="Redo" onClick={() => window.dispatchEvent(new CustomEvent('redo-customizer'))} style={{ opacity: canRedo ? 1 : 0.4, cursor: canRedo ? 'pointer' : 'default' }} disabled={!canRedo}><Redo2 size={16} /></button>
          </div>
          <button className={styles.previewBtn} onClick={() => {
            if (!isPreviewMode) {
              setActiveTab("Design");
              setIsPreviewMode(true);
            } else {
              setIsPreviewMode(false);
            }
          }}>
            {isPreviewMode ? 'Exit Preview' : 'Preview'}
          </button>
          <button className={styles.nextBtn} onClick={handleNext}>
            {activeTab === "Design" ? (
              <>Next<span className={styles.btnTextSuffix}>: Options</span></>
            ) : activeTab === "Options" ? (
              <>Next<span className={styles.btnTextSuffix}>: Review</span></>
            ) : (isSaving || isUploadingAssets) ? (
              "Processing..."
            ) : (
              "Add to Cart"
            )}
          </button>
        </div>
      </header>

      {/* Main Workspace Area */}
      <div className={styles.mainContent}>
        {isLoadingProduct && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontFamily: 'var(--font-sans)', color: '#94a3b8' }}>Loading product assets...</div>
        )}



        {activeTab === "Design" && !isLoadingProduct && (
          <PoloCustomizer 
            initialState={customizerState}
            onChange={(s) => setCustomizerState({ ...customizerState, ...s } as CustomizerState)} 
            isPreviewMode={isPreviewMode}
            activeSide={activeSide}
            onSideChange={setActiveSide}
            garmentType={customizerState?.garmentType as any}
            availableColors={synchronizedColors}
          />
        )}
        
        {activeTab === "Options" && (
          <div className={styles.tabContent}>
            <SizeBreakdown 
              sizes={(customizerState?.sizes as any) || {}}
              moq={MOQ}
              totalQuantity={totalQuantity}
              onSizeChange={handleSizeChange}
            />
            
            {/* Production Assets Section */}
            <div id="production-assets-section" className={styles.tabContentInner} style={{ borderTop: '1px solid #e2e8f0', paddingTop: '28px', marginTop: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Production Assets</h3>
                {hasLogoElements && (
                  <span style={{
                    fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.04em',
                    padding: '3px 10px', borderRadius: '20px',
                    background: needsProductionAsset ? '#fef2f2' : '#f0fdf4',
                    color: needsProductionAsset ? '#dc2626' : '#16a34a',
                    border: `1px solid ${needsProductionAsset ? '#fecaca' : '#86efac'}`,
                  }}>
                    {needsProductionAsset ? 'Required' : 'Uploaded ✓'}
                  </span>
                )}
              </div>
              <p style={{ color: '#64748b', marginBottom: '16px', fontSize: '0.85rem' }}>Upload high-res vector files for manufacturing.</p>

              {/* Warning banner — shown only when logos on canvas but no file uploaded yet */}
              {needsProductionAsset && (
                <div style={{
                  display: 'flex', alignItems: 'flex-start', gap: '10px',
                  padding: '12px 14px',
                  background: '#fef9ec',
                  border: '1.5px solid #fcd34d',
                  borderRadius: '10px',
                  marginBottom: '14px',
                }}>
                  <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>⚠️</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#92400e', marginBottom: '2px' }}>
                      Production file required to continue
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#b45309', lineHeight: 1.5 }}>
                      You've added a logo/image to your design. Please upload the original high-res file (AI, PDF, PNG, SVG) so our team can reproduce it accurately.
                    </div>
                  </div>
                </div>
              )}

              <div 
                onClick={() => fileInputRef.current?.click()} 
                className={styles.uploadArea}
                style={needsProductionAsset ? { borderColor: '#f59e0b', background: '#fffbeb' } : {}}
              >
                <UploadCloud size={28} color={needsProductionAsset ? '#f59e0b' : '#94a3b8'} style={{ margin: '0 auto 10px' }} />
                <div style={{ fontWeight: 600, color: needsProductionAsset ? '#92400e' : '#475569', fontSize: '0.9rem' }}>Click to upload production files</div>
              </div>
              <input type="file" multiple ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileUpload} />

              {/* Uploaded Files List */}
              {productionFiles.length > 0 && (
                <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {productionFiles.map((file, idx) => (
                    <div key={idx} style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '0.85rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                        <span style={{ color: 'var(--tth-olive-dark)', display: 'flex', alignItems: 'center' }}>
                          <FileText size={18} />
                        </span>
                        <span style={{ fontWeight: 600, color: '#334155', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                          {file.name}
                        </span>
                        <span style={{ color: '#64748b', fontSize: '0.75rem' }}>
                          ({(file.size / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(idx);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#ef4444',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          padding: '4px',
                          borderRadius: '4px',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#fee2e2'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "Review" && (
          <div className={styles.tabContent} style={{ padding: '0' }}>
            <div className={styles.reviewGrid}>
              {/* LEFT: Compact Mockup Thumbnails */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Side-by-side mockup thumbnails */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ background: '#f9f9f7', border: '1px solid #e5e2da', borderRadius: '12px', overflow: 'hidden' }}>
                    <div style={{ padding: '8px 12px', borderBottom: '1px solid #eee', fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Front View</div>
                    <div style={{ height: '200px', position: 'relative' }}>
                      <PoloCustomizer 
                        initialState={customizerState} 
                        isPreviewMode={true} 
                        activeSide="front" 
                        mockupId="review-mockup-front" 
                        availableColors={synchronizedColors}
                      />
                    </div>
                  </div>
                  <div style={{ background: '#f9f9f7', border: '1px solid #e5e2da', borderRadius: '12px', overflow: 'hidden' }}>
                    <div style={{ padding: '8px 12px', borderBottom: '1px solid #eee', fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Back View</div>
                    <div style={{ height: '200px', position: 'relative' }}>
                      <PoloCustomizer 
                        initialState={customizerState} 
                        isPreviewMode={true} 
                        activeSide="back" 
                        mockupId="review-mockup-back" 
                        availableColors={synchronizedColors}
                      />
                    </div>
                  </div>
                  {customizerState?.leftElements && customizerState.leftElements.length > 0 && (
                  <div style={{ background: '#f9f9f7', border: '1px solid #e5e2da', borderRadius: '12px', overflow: 'hidden' }}>
                    <div style={{ padding: '8px 12px', borderBottom: '1px solid #eee', fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Sleeves</div>
                    <div style={{ height: '200px', position: 'relative' }}>
                      <PoloCustomizer 
                        initialState={customizerState} 
                        isPreviewMode={true} 
                        activeSide="left" 
                        mockupId="review-mockup-left" 
                        availableColors={synchronizedColors}
                      />
                    </div>
                  </div>
                  )}
                  {customizerState?.rightElements && customizerState.rightElements.length > 0 && (
                  <div style={{ background: '#f9f9f7', border: '1px solid #e5e2da', borderRadius: '12px', overflow: 'hidden' }}>
                    <div style={{ padding: '8px 12px', borderBottom: '1px solid #eee', fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Right Sleeve</div>
                    <div style={{ height: '200px', position: 'relative' }}>
                      <PoloCustomizer 
                        initialState={customizerState} 
                        isPreviewMode={true} 
                        activeSide="right" 
                        mockupId="review-mockup-right" 
                        availableColors={synchronizedColors}
                      />
                    </div>
                  </div>
                  )}
                </div>

                {/* What's included checklist */}
                <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '16px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>What's Included</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {[
                      { icon: <Palette size={15} color="#64748b" />, text: 'Custom print on garment as designed' },
                      { icon: <Ruler size={15} color="#64748b" />, text: 'Industry-standard print placement' },
                      { icon: <Shield size={15} color="#64748b" />, text: 'Quality checked before dispatch' },
                      { icon: <Truck size={15} color="#64748b" />, text: 'Pan-India delivery included' },
                    ].map((item, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.82rem', color: '#374151' }}>
                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{item.icon}</span>
                        {item.text}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <OrderSummary 
                product={dbProduct}
                customizerState={customizerState!}
                totalQuantity={totalQuantity}
                productionFiles={productionFiles}
                onAddtoCart={handleNext}
              />
            </div>
          </div>
        )}

      </div>

      {/* Brand-matched Toast Notification */}
      <div
        style={{
          position: 'fixed',
          bottom: toast.visible ? '32px' : '-120px',
          left: '50%',
          transform: 'translateX(-50%)',
          transition: 'bottom 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)',
          zIndex: 9999,
          pointerEvents: 'none',
          minWidth: '300px',
          maxWidth: '480px',
          width: 'max-content',
        }}
      >
        <div style={{
          background: '#FFFBEB',
          border: `1px solid ${
            toast.type === 'error'   ? '#FECDD3' :
            toast.type === 'success' ? '#BBF7D0' :
            toast.type === 'warning' ? '#FDE68A' :
                                       '#99F6E4'
          }`,
          borderLeft: `4px solid ${
            toast.type === 'error'   ? '#F43F5E' :
            toast.type === 'success' ? '#4a5c3f' :
            toast.type === 'warning' ? '#F59E0B' :
                                       '#14B8A6'
          }`,
          borderRadius: '12px',
          padding: '13px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          boxShadow: '0 8px 32px rgba(26, 26, 24, 0.12), 0 2px 8px rgba(26, 26, 24, 0.06)',
          fontFamily: 'var(--font-sans)',
        }}>
          {/* Icon dot */}
          <span style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            background:
              toast.type === 'error'   ? '#FFF1F2' :
              toast.type === 'success' ? '#f0fdf4' :
              toast.type === 'warning' ? '#FFFBEB' :
                                         '#F0FDFA',
            border: `1.5px solid ${
              toast.type === 'error'   ? '#FDA4AF' :
              toast.type === 'success' ? '#86efac' :
              toast.type === 'warning' ? '#FCD34D' :
                                         '#5EEAD4'
            }`,
            color:
              toast.type === 'error'   ? '#E11D48' :
              toast.type === 'success' ? '#4a5c3f' :
              toast.type === 'warning' ? '#B45309' :
                                         '#0D9488',
          }}>
            {toast.type === 'error' ? '✕' : toast.type === 'success' ? '✓' : toast.type === 'warning' ? '⚠' : 'i'}
          </span>
          {/* Message */}
          <span style={{
            fontSize: '0.875rem',
            fontWeight: 600,
            color: '#1a1a18',
            lineHeight: 1.4,
            letterSpacing: '-0.01em',
          }}>
            {toast.message}
          </span>
        </div>
      </div>

    </main>
  );
}

export default function CustomizerPage() {
  return (
    <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'var(--font-sans)', color: '#94a3b8' }}>Loading customizer...</div>}>
      <CustomizerContent />
    </Suspense>
  );
}
