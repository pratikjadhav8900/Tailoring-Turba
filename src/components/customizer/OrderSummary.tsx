"use client";
import React from "react";
import Image from "next/image";
import { FileText } from "lucide-react";
import { CustomizerState } from "@/types/customizer";

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
  const hasCustomization = (customizerState.frontElements.length || 0) > 0 || (customizerState.backElements.length || 0) > 0;
  const customCharge = hasCustomization ? 300 : 0;
  const gst = (subtotal + customCharge) * 0.05;
  const total = subtotal + customCharge + gst;

  return (
    <div style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', height: 'fit-content' }}>
      <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px', color: '#111', fontFamily: 'var(--font-serif)' }}>Order Summary</h2>
      
      {product && (
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', padding: '16px', background: '#f9f9f7', border: '1px solid #e5e2da', borderRadius: '8px', marginBottom: '16px' }}>
          <div style={{ position: 'relative', width: '64px', height: '64px', borderRadius: '4px', overflow: 'hidden', flexShrink: 0 }}>
            <Image src={product.images?.[0] || product.image} alt={product.name} fill style={{ objectFit: 'cover' }} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#111' }}>{product.name}</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--tth-olive-dark)', marginTop: '4px' }}>₹{basePrice.toLocaleString('en-IN')} / unit</div>
          </div>
        </div>
      )}

      <div style={{ borderTop: '2px solid #E5E7EB', paddingTop: '24px', marginBottom: '32px', fontFamily: 'var(--font-sans)' }}>
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
      </div>

      <button 
        onClick={onAddtoCart}
        style={{ 
          width: '100%', padding: '16px', background: 'var(--tth-olive-dark)', color: 'white', border: 'none', borderRadius: '8px', 
          fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s', textTransform: 'uppercase', letterSpacing: '0.05em'
        }}
      >
        Add To Cart
      </button>
    </div>
  );
}
