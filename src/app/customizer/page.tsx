"use client";
import { useState, useEffect, useRef, Suspense, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import PoloCustomizer from "@/components/customizer/PoloCustomizer";
import { CustomizerState } from "@/types/customizer";
import styles from "./page.module.css";
import { X, Undo2, Redo2, Eye, EyeOff, UploadCloud, FileText, Trash2 } from "lucide-react";
import { useCart } from "@/context/CartContext";
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
  const [activeSide, setActiveSide] = useState<"front" | "back">("front");
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [productionFiles, setProductionFiles] = useState<{name: string, size: number, url: string}[]>([]);
  const [toast, setToast] = useState<{message: string, visible: boolean}>({message: "", visible: false});
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

  useEffect(() => {
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
  }, [productId]);

  // Map product category to garment type
  const categoryToGarment = (category: string, name?: string): string => {
    const lowerName = (name || '').toLowerCase();
    if (lowerName.includes('polo')) return 'polo';
    if (lowerName.includes('hoodie')) return 'hoodie';
    if (lowerName.includes('jacket')) return 'hoodie';
    
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
      ? categoryToGarment(dbProduct.category?.name || dbProduct.category, dbProduct.name) 
      : (garment || 'round-neck');
    
    // Only set initial state once
    if (!customizerState) {
      setCustomizerState({
        garmentType: derivedGarment,
        bodyColor: 'transparent',
        frontElements: [],
        backElements: [],
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
  }, [customizerState?.frontElements, customizerState?.backElements, customizerState?.bodyColor, customizerState?.garmentType]);

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

  const showToast = (message: string) => {
    setToast({ message, visible: true });
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
        showToast(`Minimum order quantity is ${MOQ} pieces. Please add more sizes.`);
        return;
      }
      setActiveTab("Review");
      setIsPreviewMode(false);
    } else {
      if (isUploadingAssets) {
        showToast("Please wait for your assets to finish uploading.");
        return;
      }
      if (!customizerState || totalQuantity === 0) {
        showToast("Please add at least one garment size to proceed.");
        return;
      }
      
      setIsSaving(true);
      try {
        // Capture Mockup
        let mockupUrl = "";
        let mockupUrlBack = "";
        
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
              logging: false,
              allowTaint: true
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
          customDesign: customizerState,
          uploadedAssets: productionFiles.map(f => f.url),
        });
        router.push('/cart');
      } catch (err) {
        showToast("Failed to process order assets. Please try again.");
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
      showToast("Uploading production assets...");
      
      for (const file of files) {
        try {
          const res = await uploadFile(file);
          setProductionFiles(prev => [...prev, {
            name: file.name,
            size: file.size,
            url: res.url
          }]);
        } catch (err) {
          showToast(`Failed to upload ${file.name}`);
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
        showToast("Please login to save your design to your account.");
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
      showToast("Design saved to your account!");
    } catch (err) {
      console.error(err);
      showToast("An error occurred while saving the design.");
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
                showToast("Please add at least one garment size to proceed.");
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
            {nextText}
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
            onSideChange={(s) => setActiveSide(s as "front" | "back")}
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
            <div className={styles.tabContentInner} style={{ borderTop: '1px solid #e2e8f0', paddingTop: '28px', marginTop: '20px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>Production Assets</h3>
              <p style={{ color: '#64748b', marginBottom: '16px', fontSize: '0.85rem' }}>Upload high-res vector files for manufacturing.</p>
              
              <div onClick={() => fileInputRef.current?.click()} className={styles.uploadArea}>
                <UploadCloud size={28} color="#94a3b8" style={{ margin: '0 auto 10px' }} />
                <div style={{ fontWeight: 600, color: '#475569', fontSize: '0.9rem' }}>Click to upload production files</div>
              </div>
              <input type="file" multiple ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileUpload} />
            </div>
          </div>
        )}

        {activeTab === "Review" && (
          <div className={styles.tabContent} style={{ padding: '0' }}>
            <div className={styles.reviewGrid}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className={styles.reviewMockupWrap}>
                  <div className={styles.reviewMockupLabel}>Front View</div>
                  <PoloCustomizer 
                    initialState={customizerState} 
                    isPreviewMode={true} 
                    activeSide="front" 
                    mockupId="review-mockup-front" 
                    availableColors={synchronizedColors}
                  />
                </div>
                <div className={styles.reviewMockupWrap}>
                  <div className={styles.reviewMockupLabel}>Back View</div>
                  <PoloCustomizer 
                    initialState={customizerState} 
                    isPreviewMode={true} 
                    activeSide="back" 
                    mockupId="review-mockup-back" 
                    availableColors={synchronizedColors}
                  />
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

      {/* Sleek Custom Toast Notification */}
      <div 
        style={{
          position: 'fixed',
          bottom: toast.visible ? '32px' : '-100px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#EF4444',
          color: 'white',
          padding: '14px 28px',
          borderRadius: '12px',
          fontWeight: '500',
          fontSize: '15px',
          boxShadow: '0 8px 30px rgba(239, 68, 68, 0.4)',
          transition: 'bottom 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          pointerEvents: 'none'
        }}
      >
        <span style={{ 
          background: 'rgba(255,255,255,0.25)', 
          width: '24px', 
          height: '24px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          borderRadius: '50%',
          fontSize: '14px',
          fontWeight: 'bold'
        }}>!</span>
        {toast.message}
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
