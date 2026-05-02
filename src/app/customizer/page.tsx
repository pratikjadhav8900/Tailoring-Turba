"use client";
import { useState, useEffect, useRef, Suspense, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import PoloCustomizer from "@/components/customizer/PoloCustomizer";
import { CustomizerState } from "@/types/customizer";
import styles from "./page.module.css";
import { X, Undo2, Redo2, Eye, EyeOff, UploadCloud, FileText, Trash2 } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { allProducts } from "@/lib/products-data";
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
        setDbProduct({
          ...data,
          price: `₹${data.basePrice}` // Format for consistency
        });
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
  const categoryToGarment = (category: string): string => {
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
      ? categoryToGarment(dbProduct.category?.name || dbProduct.category) 
      : (garment || 'round-neck');
    
    // Only set initial state once
    if (!customizerState) {
      setCustomizerState({
        garmentType: derivedGarment,
        bodyColor: '#111111',
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

        const priceMatch = dbProduct?.price?.match(/\d+/);
        const basePrice = priceMatch ? priceMatch[0] : (dbProduct?.basePrice?.toString() || "85");

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

  const MOQ = 10;

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
        {activeTab === "Design" && (
          <PoloCustomizer 
            initialState={customizerState}
            onChange={(s) => setCustomizerState({ ...customizerState, ...s } as CustomizerState)} 
            isPreviewMode={isPreviewMode}
            activeSide={activeSide}
            onSideChange={(s) => setActiveSide(s as "front" | "back")}
          />
        )}
        
        {activeTab === "Options" && (
          <div className={styles.tabContent}>
            <div style={{ maxWidth: '700px', margin: '32px auto', padding: '0 24px' }}>
              
              {/* Header */}
              <div style={{ marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <h2 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#0f172a', fontFamily: 'var(--font-serif)', margin: 0 }}>Size Breakdown</h2>
                  <span style={{ background: totalQuantity >= MOQ ? '#dcfce7' : '#fef9c3', color: totalQuantity >= MOQ ? '#166534' : '#854d0e', fontSize: '0.75rem', fontWeight: 700, padding: '4px 12px', borderRadius: '20px', letterSpacing: '0.05em' }}>
                    {totalQuantity >= MOQ ? `✓ MOQ Met` : `MOQ: ${MOQ} pcs min`}
                  </span>
                </div>
                <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>Distribute your order across sizes. Minimum {MOQ} pieces total to proceed.</p>
              </div>

              {/* Size Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', marginBottom: '28px' }}>
                {['S', 'M', 'L', 'XL', 'XXL'].map((size) => {
                  const qty = customizerState?.sizes?.[size as keyof typeof customizerState.sizes] || 0;
                  return (
                    <div key={size} style={{ background: qty > 0 ? '#f0fdf4' : '#f8fafc', border: `2px solid ${qty > 0 ? '#86efac' : '#e2e8f0'}`, borderRadius: '12px', padding: '16px 12px', textAlign: 'center', transition: 'all 0.2s' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', color: '#94a3b8', marginBottom: '12px' }}>{size}</div>
                      <button
                        onClick={() => handleSizeChange(size, qty - 1)}
                        style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontSize: '1rem', lineHeight: 1, color: '#64748b' }}
                      >−</button>
                      <div style={{ fontSize: '1.5rem', fontWeight: 800, color: qty > 0 ? '#166534' : '#1e293b', margin: '8px 0', lineHeight: 1 }}>{qty}</div>
                      <button
                        onClick={() => handleSizeChange(size, qty + 1)}
                        style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontSize: '1rem', lineHeight: 1, color: '#64748b' }}
                      >+</button>
                    </div>
                  );
                })}
              </div>

              {/* MOQ Progress Bar */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px 24px', marginBottom: '28px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>Total Quantity</span>
                  <span style={{ fontWeight: 800, fontSize: '1.6rem', color: totalQuantity >= MOQ ? '#16a34a' : '#0f172a' }}>{totalQuantity}</span>
                </div>
                <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '99px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.min(100, (totalQuantity / MOQ) * 100)}%`, background: totalQuantity >= MOQ ? '#16a34a' : '#f59e0b', borderRadius: '99px', transition: 'width 0.3s ease' }} />
                </div>
                {totalQuantity < MOQ && (
                  <div style={{ marginTop: '8px', fontSize: '0.8rem', color: '#92400e' }}>{MOQ - totalQuantity} more piece{MOQ - totalQuantity !== 1 ? 's' : ''} needed to meet minimum order quantity</div>
                )}
              </div>

              {/* Production Assets Section */}
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '28px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>Production Assets</h3>
                <p style={{ color: '#64748b', marginBottom: '16px', fontSize: '0.85rem' }}>Upload high-res vector files (.ai, .cdr, .pdf) or images (.png, .jpg) of your logos and artworks for manufacturing.</p>
                
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  style={{ border: '2px dashed #cbd5e1', borderRadius: '10px', padding: '28px', textAlign: 'center', cursor: 'pointer', background: '#f8fafc', transition: 'all 0.2s' }}
                  onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--tth-olive-dark)'; e.currentTarget.style.background = '#f0fdf4'; }}
                  onMouseOut={(e) => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.background = '#f8fafc'; }}
                >
                  <UploadCloud size={28} color="#94a3b8" style={{ margin: '0 auto 10px' }} />
                  <div style={{ fontWeight: 600, color: '#475569', fontSize: '0.9rem' }}>Click to upload production files</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>Any file type · Up to 50MB</div>
                </div>
                <input type="file" multiple ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileUpload} />

                {productionFiles.length > 0 && (
                  <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {productionFiles.map((file, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <FileText size={18} color="var(--tth-olive-dark)" />
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#1e293b' }}>{file.name}</div>
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{(file.size / 1024).toFixed(1)} KB</div>
                          </div>
                        </div>
                        <button onClick={() => removeFile(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '4px' }}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "Review" && (
          <div className={styles.tabContent} style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '40px', padding: '40px', maxWidth: '1400px', margin: '0 auto', height: '100%' }}>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ background: '#F9FAFB', borderRadius: '12px', overflow: 'hidden', border: '1px solid #E5E7EB', position: 'relative', flex: 1 }}>
                <div style={{ padding: '12px', fontSize: '10px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', borderBottom: '1px solid #eee' }}>Front View</div>
                <PoloCustomizer 
                  initialState={customizerState}
                  isPreviewMode={true}
                  activeSide="front"
                  mockupId="review-mockup-front"
                />
              </div>
              <div style={{ background: '#F9FAFB', borderRadius: '12px', overflow: 'hidden', border: '1px solid #E5E7EB', position: 'relative', flex: 1 }}>
                <div style={{ padding: '12px', fontSize: '10px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', borderBottom: '1px solid #eee' }}>Back View</div>
                <PoloCustomizer 
                  initialState={customizerState}
                  isPreviewMode={true}
                  activeSide="back"
                  mockupId="review-mockup-back"
                />
              </div>
            </div>

            <div style={{ background: 'white', padding: '32px', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', height: 'fit-content' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px', color: '#111' }}>Order Summary</h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
                {dbProduct && (
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center', padding: '16px', background: '#f9f9f7', border: '1px solid #e5e2da', borderRadius: '8px', marginBottom: '8px' }}>
                    <div style={{ position: 'relative', width: '64px', height: '64px', borderRadius: '4px', overflow: 'hidden', flexShrink: 0 }}>
                      <Image src={dbProduct.images?.[0] || dbProduct.image} alt={dbProduct.name} fill style={{ objectFit: 'cover' }} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#111' }}>{dbProduct.name}</div>
                      <div style={{ fontSize: '0.8rem', color: '#888', marginTop: '2px' }}>{dbProduct.type || dbProduct.category?.name}</div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--tth-olive-dark)', marginTop: '4px' }}>{dbProduct.price} / unit</div>
                    </div>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#666' }}>Garment Type</span>
                  <span style={{ fontWeight: 'bold', textTransform: 'capitalize' }}>{customizerState?.garmentType.replace('-', ' ')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#666' }}>Base Color</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: customizerState?.bodyColor, border: '1px solid #D1D5DB' }}></div>
                    <span style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>{customizerState?.bodyColor}</span>
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '32px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px', borderBottom: '1px solid #E5E7EB', paddingBottom: '8px' }}>Size Breakdown</h3>
                {['S', 'M', 'L', 'XL', 'XXL'].map((size) => {
                  const qty = customizerState?.sizes?.[size as keyof typeof customizerState.sizes] || 0;
                  if (qty > 0) {
                    return (
                      <div key={size} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span>Size {size}</span>
                        <span style={{ fontWeight: 'bold' }}>{qty}x</span>
                      </div>
                    );
                  }
                  return null;
                })}
              </div>

              {productionFiles.length > 0 && (
                <div style={{ marginBottom: '32px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px', borderBottom: '1px solid #E5E7EB', paddingBottom: '8px' }}>Attached Files</h3>
                  {productionFiles.map((f, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '14px' }}>
                      <FileText size={14} color="#6B7280" />
                      <span style={{ color: '#374151', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '250px' }}>{f.name}</span>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ borderTop: '2px solid #E5E7EB', paddingTop: '24px', marginBottom: '32px' }}>
                {/* Calculations */}
                {(() => {
                  const priceMatch = dbProduct?.price?.match(/\d+/);
                  const basePrice = priceMatch ? parseInt(priceMatch[0], 10) : (dbProduct?.basePrice || 85);
                  const subtotal = totalQuantity * basePrice;
                  const hasCustomization = (customizerState?.frontElements.length || 0) > 0 || (customizerState?.backElements.length || 0) > 0;
                  const customCharge = hasCustomization ? 300 : 0;
                  const gst = (subtotal + customCharge) * 0.05;
                  const total = subtotal + customCharge + gst;

                  return (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ color: '#666' }}>Subtotal ({totalQuantity} units)</span>
                        <span style={{ fontWeight: 600 }}>₹{subtotal.toLocaleString('en-IN')}</span>
                      </div>
                      
                      {hasCustomization && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{ color: '#666' }}>Customization Fee</span>
                          <span style={{ fontWeight: 600 }}>₹{customCharge.toLocaleString('en-IN')}</span>
                        </div>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <span style={{ color: '#666' }}>GST (5%)</span>
                        <span style={{ fontWeight: 600 }}>₹{Math.round(gst).toLocaleString('en-IN')}</span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '18px', fontWeight: 'bold' }}>Total Estimate</span>
                        <span style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--tth-olive-dark)' }}>
                          ₹{Math.round(total).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </>
                  );
                })()}
                
                <p style={{ fontSize: '11px', color: '#888', marginTop: '12px', fontStyle: 'italic' }}>
                  * Includes 5% GST and flat customization setup fee where applicable.
                </p>
              </div>

              <button 
                onClick={handleNext}
                style={{ 
                  width: '100%', 
                  padding: '16px', 
                  background: 'var(--tth-olive-dark)', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '8px', 
                  fontSize: '16px', 
                  fontWeight: 'bold', 
                  cursor: 'pointer', 
                  transition: 'all 0.2s',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = '#3a4d2c'}
                onMouseOut={(e) => e.currentTarget.style.background = 'var(--tth-olive-dark)'}
              >
                Add To Cart
              </button>
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
