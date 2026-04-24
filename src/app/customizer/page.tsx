"use client";
import { useState, useEffect, useRef, Suspense } from "react";
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
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [productionFiles, setProductionFiles] = useState<{name: string, size: number}[]>([]);
  const [toast, setToast] = useState<{message: string, visible: boolean}>({message: "", visible: false});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addToCart } = useCart();

  // Read URL parameters and pre-populate customizer state
  const productId = searchParams.get('productId');
  const selectedProduct = productId ? allProducts.find(p => p.id === parseInt(productId)) : null;

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
    return map[category] || 'round-neck';
  };

  useEffect(() => {
    const garment = searchParams.get('garment');
    const fabricId = searchParams.get('fabricId');
    const derivedGarment = selectedProduct 
      ? categoryToGarment(selectedProduct.category) 
      : (garment || 'round-neck');
    
    setCustomizerState({
      garmentType: derivedGarment,
      bodyColor: '#111111',
      frontElements: [],
      backElements: [],
      fabricId: fabricId || undefined,
      sizes: { S: 0, M: 0, L: 0, XL: 0, XXL: 0 }
    });
  }, [searchParams]);

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

  const handleNext = () => {
    if (activeTab === "Design") {
      setActiveTab("Options");
    } else if (activeTab === "Options") {
      if (totalQuantity === 0) {
        showToast("Please add at least one garment size to proceed.");
        return;
      }
      setActiveTab("Review");
    } else {
      if (!customizerState || totalQuantity === 0) {
        showToast("Please add at least one garment size to proceed.");
        return;
      }
      // Add to cart
      addToCart({
        id: `custom-${Date.now()}`,
        code: "CUSTOM-DESIGN",
        name: `Customized ${customizerState.garmentType.replace(/-/g, ' ')}`,
        price: "199.00", 
        quantity: totalQuantity,
        customDesign: customizerState,
        uploadedAssets: productionFiles.map(f => f.name),
      });
      router.push('/cart');
    }
  };

  const nextText = activeTab === "Design" ? "Next: Options" : activeTab === "Options" ? "Next: Review" : "Add to Cart";

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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map(f => ({
        name: f.name,
        size: f.size
      }));
      setProductionFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setProductionFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <main className={styles.appLayout}>
      {/* Top App Bar (Zazzle-style) */}
      <header className={styles.topBar}>
        <div className={styles.topBarLeft}>
          <button 
            className={styles.exitBtn} 
            onClick={() => {
              const dest = selectedProduct ? `/products/${selectedProduct.id}` : '/';
              window.location.href = dest;
            }}
          >
            <X size={18} /> {selectedProduct ? 'Back to Product' : 'Save and Exit'}
          </button>
          <div className={styles.productName}>
            {selectedProduct ? selectedProduct.name : 'Custom Design'}
          </div>
          {selectedProduct && (
            <div style={{ fontSize: '0.75rem', color: '#888', fontFamily: 'var(--font-sans)', background: '#f5f5f5', padding: '4px 10px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--tth-olive-dark)', display: 'inline-block' }} />
              {selectedProduct.type}
            </div>
          )}
          <div className={styles.saveStatus}>
            <div className={styles.saveDot} /> Saved
          </div>
        </div>

        <div className={styles.topBarCenter}>
          <button 
            className={`${styles.tab} ${activeTab === "Design" ? styles.tabActive : ""}`}
            onClick={() => setActiveTab("Design")}
          >
            Design
          </button>
          <button 
            className={`${styles.tab} ${activeTab === "Options" ? styles.tabActive : ""}`}
            onClick={() => setActiveTab("Options")}
          >
            Options
          </button>
          <button 
            className={`${styles.tab} ${activeTab === "Review" ? styles.tabActive : ""}`}
            onClick={() => {
              if (totalQuantity === 0 && activeTab !== "Review") {
                showToast("Please add at least one garment size to proceed.");
                setActiveTab("Options");
                return;
              }
              setActiveTab("Review");
            }}
          >
            Review
          </button>
        </div>

        <div className={styles.topBarRight}>
          <div className={styles.actionIcons}>
            <button className={styles.iconBtn} title="Undo" onClick={() => window.dispatchEvent(new Event('undo-customizer'))} style={{ opacity: canUndo ? 1 : 0.4, cursor: canUndo ? 'pointer' : 'default' }} disabled={!canUndo}><Undo2 size={16} /></button>
            <button className={styles.iconBtn} title="Redo" onClick={() => window.dispatchEvent(new Event('redo-customizer'))} style={{ opacity: canRedo ? 1 : 0.4, cursor: canRedo ? 'pointer' : 'default' }} disabled={!canRedo}><Redo2 size={16} /></button>
          </div>
          <button className={styles.previewBtn} onClick={() => setIsPreviewMode(!isPreviewMode)}>
            {isPreviewMode ? <EyeOff size={18} /> : <Eye size={18} />} Preview
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
          />
        )}
        
        {activeTab === "Options" && (
          <div className={styles.tabContent}>
            <div className={styles.tabContentInner} style={{ maxWidth: '600px', margin: '40px auto', background: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px', color: '#111' }}>Garment Options</h2>
              <p style={{ color: '#666', marginBottom: '32px' }}>Enter the quantities for each size you'd like to order for this design.</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {['S', 'M', 'L', 'XL', 'XXL'].map((size) => (
                  <div key={size} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', border: '1px solid #E5E7EB', borderRadius: '8px' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '18px', width: '40px' }}>{size}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <button 
                        style={{ width: '32px', height: '32px', borderRadius: '4px', border: '1px solid #D1D5DB', background: 'white', cursor: 'pointer' }}
                        onClick={() => handleSizeChange(size, (customizerState?.sizes?.[size as keyof typeof customizerState.sizes] || 0) - 1)}
                      >-</button>
                      <input 
                        type="number" 
                        value={customizerState?.sizes?.[size as keyof typeof customizerState.sizes] || 0}
                        onChange={(e) => handleSizeChange(size, parseInt(e.target.value) || 0)}
                        style={{ width: '60px', textAlign: 'center', border: '1px solid #D1D5DB', borderRadius: '4px', height: '32px' }}
                      />
                      <button 
                        style={{ width: '32px', height: '32px', borderRadius: '4px', border: '1px solid #D1D5DB', background: 'white', cursor: 'pointer' }}
                        onClick={() => handleSizeChange(size, (customizerState?.sizes?.[size as keyof typeof customizerState.sizes] || 0) + 1)}
                      >+</button>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '18px', fontWeight: 'bold' }}>Total Quantity</span>
                <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#25338B' }}>{totalQuantity}</span>
              </div>

              {/* Production Assets Section */}
              <div style={{ marginTop: '40px', paddingTop: '32px', borderTop: '2px solid #E5E7EB' }}>
                <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px', color: '#111' }}>Production Assets</h3>
                <p style={{ color: '#666', marginBottom: '16px', fontSize: '14px' }}>Please upload the high-resolution vector files (.ai, .cdr, .pdf) or high-quality images (.png, .jpg) of your logos and artworks for manufacturing.</p>
                
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  style={{ border: '2px dashed #D1D5DB', borderRadius: '8px', padding: '32px', textAlign: 'center', cursor: 'pointer', background: '#F9FAFB', transition: 'border-color 0.2s, background 0.2s' }}
                  onMouseOver={(e) => { e.currentTarget.style.borderColor = '#25338B'; e.currentTarget.style.background = '#F3F4F6'; }}
                  onMouseOut={(e) => { e.currentTarget.style.borderColor = '#D1D5DB'; e.currentTarget.style.background = '#F9FAFB'; }}
                >
                  <UploadCloud size={32} color="#6B7280" style={{ margin: '0 auto 12px' }} />
                  <div style={{ fontWeight: 'bold', color: '#374151' }}>Click to upload files</div>
                  <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>Any file type supported up to 50MB</div>
                </div>
                <input type="file" multiple ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileUpload} />

                {productionFiles.length > 0 && (
                  <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {productionFiles.map((file, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'white', border: '1px solid #E5E7EB', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <FileText size={20} color="#25338B" />
                          <div>
                            <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#111', wordBreak: 'break-all' }}>{file.name}</div>
                            <div style={{ fontSize: '12px', color: '#6B7280' }}>{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                          </div>
                        </div>
                        <button onClick={() => removeFile(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444' }} title="Remove file">
                          <Trash2 size={18} />
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
            
            <div style={{ background: '#F9FAFB', borderRadius: '12px', overflow: 'hidden', border: '1px solid #E5E7EB', position: 'relative' }}>
              <PoloCustomizer 
                initialState={customizerState}
                isPreviewMode={true}
              />
            </div>

            <div style={{ background: 'white', padding: '32px', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', height: 'fit-content' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px', color: '#111' }}>Order Summary</h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
                {selectedProduct && (
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center', padding: '16px', background: '#f9f9f7', border: '1px solid #e5e2da', borderRadius: '8px', marginBottom: '8px' }}>
                    <div style={{ position: 'relative', width: '64px', height: '64px', borderRadius: '4px', overflow: 'hidden', flexShrink: 0 }}>
                      <Image src={selectedProduct.image} alt={selectedProduct.name} fill style={{ objectFit: 'cover' }} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#111' }}>{selectedProduct.name}</div>
                      <div style={{ fontSize: '0.8rem', color: '#888', marginTop: '2px' }}>{selectedProduct.type}</div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--tth-olive-dark)', marginTop: '4px' }}>{selectedProduct.price} / unit</div>
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '18px', fontWeight: 'bold' }}>Total Estimate</span>
                  <span style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--tth-olive-dark)' }}>
                    ₹{selectedProduct 
                      ? (totalQuantity * parseInt(selectedProduct.price.replace(/[^0-9]/g, ''))).toLocaleString('en-IN')
                      : (totalQuantity * 199).toLocaleString('en-IN')}
                  </span>
                </div>
                <p style={{ fontSize: '12px', color: '#666', marginTop: '8px', textAlign: 'right' }}>
                  {selectedProduct ? selectedProduct.price : '₹199'} per unit
                </p>
              </div>

              <button 
                onClick={handleNext}
                style={{ width: '100%', padding: '16px', background: '#25338B', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', transition: 'background 0.2s' }}
                onMouseOver={(e) => e.currentTarget.style.background = '#1a2466'}
                onMouseOut={(e) => e.currentTarget.style.background = '#25338B'}
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
