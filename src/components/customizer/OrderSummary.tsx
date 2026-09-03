"use client";
import React from "react";
import Image from "next/image";
import { ShoppingCart, Palette, Ruler, Package, Shield, ChevronRight } from "lucide-react";
import { CustomizerState } from "@/types/customizer";
import { getElementDetails } from "@/lib/customizer-utils";

interface OrderSummaryProps {
  product: any;
  customizerState: CustomizerState;
  totalQuantity: number;
  productionFiles: any[];
  onAddtoCart: () => void;
}

export default function OrderSummary({
  product,
  customizerState,
  totalQuantity,
  productionFiles,
  onAddtoCart,
}: OrderSummaryProps) {
  const basePrice = product?.basePrice || 85;
  const subtotal = totalQuantity * basePrice;
  const garmentType = customizerState.garmentType || "round-neck";

  const frontDetails = (customizerState.frontElements || []).map(el => ({
    ...el, side: "Front", ...getElementDetails(el, garmentType, "front")
  }));
  const backDetails = (customizerState.backElements || []).map(el => ({
    ...el, side: "Back", ...getElementDetails(el, garmentType, "back")
  }));

  const allCustomElements = [...frontDetails, ...backDetails];
  const unitPrintingCharge = allCustomElements.reduce((sum, item) => sum + item.cost, 0);
  const printingCharge = unitPrintingCharge * totalQuantity;
  const hasCustomization = allCustomElements.length > 0;
  const hasEmbroidery = allCustomElements.some(item => item.printType === "embroidery");
  const designCharge = hasEmbroidery ? 300 : 0;
  const totalCustomCharge = printingCharge + designCharge;
  const gst = (subtotal + totalCustomCharge) * 0.05;
  const total = subtotal + totalCustomCharge + gst;

  const sizeBreakdown = Object.entries(customizerState.sizes || {}).filter(([, qty]) => (qty || 0) > 0);

  return (
    <div style={{
      background: 'white',
      borderRadius: '16px',
      boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      height: 'fit-content',
      border: '1px solid #e8e8e8',
    }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', background: 'linear-gradient(135deg, #1a1a2e 0%, #2d4a22 100%)', color: 'white' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <ShoppingCart size={16} />
          <span style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.8 }}>Order Summary</span>
        </div>
        <div style={{ fontSize: '1.6rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
          ₹{Math.round(total).toLocaleString('en-IN')}
        </div>
        <div style={{ fontSize: '0.75rem', opacity: 0.7, marginTop: '2px' }}>
          Incl. GST • {totalQuantity} units
        </div>
      </div>

      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

        {/* Product Row — Compact */}
        {product && (
          <div style={{
            display: 'flex', gap: '12px', alignItems: 'center',
            padding: '12px', background: '#f9f9f7',
            border: '1px solid #e5e2da', borderRadius: '10px'
          }}>
            <div style={{ position: 'relative', width: '52px', height: '52px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, border: '1px solid #e5e2da' }}>
              <Image src={product.images?.[0] || product.image} alt={product.name} fill style={{ objectFit: 'cover' }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product.name}</div>
              <div style={{ fontSize: '0.75rem', color: '#888', marginTop: '2px' }}>{product.category?.name || garmentType}</div>
            </div>
            <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--tth-olive-dark)', flexShrink: 0 }}>
              ₹{basePrice}/u
            </div>
          </div>
        )}

        {/* Size Breakdown — Compact Chips */}
        {sizeBreakdown.length > 0 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <Ruler size={13} color="#888" />
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Size Breakdown</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {sizeBreakdown.map(([size, qty]) => (
                <div key={size} style={{
                  padding: '4px 10px', borderRadius: '20px',
                  background: '#f0fdf4', border: '1px solid #86efac',
                  fontSize: '0.75rem', fontWeight: 700, color: '#166534'
                }}>
                  {size}: {qty}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Customization Details — Compact */}
        {hasCustomization && (
          <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <Palette size={13} color="#888" />
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Print Details</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {allCustomElements.map((el) => (
                <div key={el.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem' }}>
                  <div>
                    <span style={{ fontWeight: 600, color: '#334155' }}>{el.side} {el.type === "text" ? "Text" : "Logo"}</span>
                    <span style={{ color: '#94a3b8', marginLeft: '6px' }}>{el.widthInches}″ × {el.heightInches}″</span>
                  </div>
                  <span style={{ fontWeight: 700, color: '#0f172a' }}>₹{el.cost}/u</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Price Breakdown */}
        <div style={{ borderTop: '1px dashed #e2e8f0', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#666' }}>
            <span>Subtotal ({totalQuantity} units)</span>
            <span style={{ fontWeight: 600, color: '#111' }}>₹{subtotal.toLocaleString('en-IN')}</span>
          </div>
          {hasCustomization && printingCharge > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#666' }}>
              <span>Customization Fee</span>
              <span style={{ fontWeight: 600, color: '#111' }}>₹{printingCharge.toLocaleString('en-IN')}</span>
            </div>
          )}
          {hasCustomization && designCharge > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#666' }}>
              <span>Designing Charge</span>
              <span style={{ fontWeight: 600, color: '#111' }}>₹{designCharge.toLocaleString('en-IN')}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#666' }}>
            <span>GST (5%)</span>
            <span style={{ fontWeight: 600, color: '#111' }}>₹{Math.round(gst).toLocaleString('en-IN')}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', paddingTop: '10px', borderTop: '2px solid #111' }}>
            <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#111' }}>Total Estimate</span>
            <span style={{ fontWeight: 900, fontSize: '1.35rem', color: 'var(--tth-olive-dark)' }}>₹{Math.round(total).toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Trust badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
          <Shield size={13} color="#16a34a" />
          <span style={{ fontSize: '0.72rem', color: '#15803d', fontWeight: 600 }}>Secure order · 100% quality guaranteed</span>
        </div>
      </div>

      {/* Sticky Add to Cart Button */}
      <div style={{ padding: '0 20px 20px' }}>
        <button
          onClick={onAddtoCart}
          style={{
            width: '100%', padding: '14px 20px',
            background: 'linear-gradient(135deg, #2d4a22 0%, #4a7c35 100%)',
            color: 'white', border: 'none', borderRadius: '10px',
            fontSize: '0.9rem', fontWeight: 800, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            textTransform: 'uppercase', letterSpacing: '0.08em',
            boxShadow: '0 4px 16px rgba(45,74,34,0.35)',
            transition: 'all 0.2s',
          }}
        >
          <ShoppingCart size={16} />
          Add To Cart
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
