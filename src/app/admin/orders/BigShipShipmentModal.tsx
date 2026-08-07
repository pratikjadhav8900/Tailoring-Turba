"use client";

import { useState, useEffect } from "react";
import { Loader2, Package, Truck, X } from "lucide-react";
import toast from "react-hot-toast";

interface Props {
  order: any;
  onClose: () => void;
  onSuccess: (trackingId: string) => void;
}

export default function BigShipShipmentModal({ order, onClose, onSuccess }: Props) {
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [preparing, setPreparing] = useState(false);
  const [booking, setBooking] = useState(false);
  const [rates, setRates] = useState<any[]>([]);
  const [selectedCourier, setSelectedCourier] = useState<any>(null);
  const [masterOrderId, setMasterOrderId] = useState("");
  
  const [formData, setFormData] = useState({
    warehouseId: "",
    weight: "0.5",
    length: "10",
    breadth: "10",
    height: "10",
  });

  useEffect(() => {
    fetch("/api/shipping/warehouses")
      .then(res => res.json())
      .then(data => {
        if (data.status) {
          setWarehouses(data.data.warehouse || []);
          if (data.data.warehouse?.length > 0) {
            setFormData(prev => ({ ...prev, warehouseId: String(data.data.warehouse[0].warehouseId) }));
          }
        }
        setLoading(false);
      });
  }, []);

  const handleFetchRates = async () => {
    setPreparing(true);
    try {
      const res = await fetch("/api/shipping/prepare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          ...formData,
        }),
      });
      const data = await res.json();
      if (data.rates) {
        setRates(data.rates);
        setMasterOrderId(data.masterCustomOrderId);
      } else {
        toast.error(data.error || "Failed to fetch rates");
      }
    } catch (err) {
      toast.error("Error preparing shipment");
    } finally {
      setPreparing(false);
    }
  };

  const handleBook = async () => {
    if (!selectedCourier) return;
    setBooking(true);
    try {
      const res = await fetch("/api/shipping/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          masterCustomOrderId: masterOrderId,
          courierId: selectedCourier.courierId,
          courierName: selectedCourier.courierName,
          shippingCharge: selectedCourier.total_freight || selectedCourier.total,
        }),
      });
      const data = await res.json();
      if (data.status) {
        onSuccess(data.data.awb_assigned);
      } else {
        toast.error(data.error || "Booking failed");
      }
    } catch (err) {
      toast.error("Error booking shipment");
    } finally {
      setBooking(false);
    }
  };

  if (loading) return <div className="p-8 text-center"><Loader2 className="animate-spin inline mr-2" /> Loading BigShip data...</div>;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        padding: '32px',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '600px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#435b43', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Truck /> Ship via BigShip
          </h2>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X /></button>
        </div>

        {warehouses.length === 0 ? (
          <div style={{ padding: '20px', border: '1px solid #fee2e2', background: '#fef2f2', color: '#dc2626', borderRadius: '8px' }}>
            No pickup warehouses found in your BigShip account. Please add one in your BigShip dashboard.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Pickup Warehouse</label>
                <select 
                  value={formData.warehouseId} 
                  onChange={(e) => setFormData({...formData, warehouseId: e.target.value})}
                  style={{ padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0', width: '100%', boxSizing: 'border-box', minWidth: 0 }}
                >
                  {warehouses.map(w => (
                    <option key={w.warehouseId} value={w.warehouseId}>{w.warehouseName} ({w.pincode})</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Weight (kg)</label>
                <input type="number" value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0', width: '100%', boxSizing: 'border-box', minWidth: 0 }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Length (cm)</label>
                <input type="number" value={formData.length} onChange={e => setFormData({...formData, length: e.target.value})} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0', width: '100%', boxSizing: 'border-box', minWidth: 0 }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Breadth (cm)</label>
                <input type="number" value={formData.breadth} onChange={e => setFormData({...formData, breadth: e.target.value})} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0', width: '100%', boxSizing: 'border-box', minWidth: 0 }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Height (cm)</label>
                <input type="number" value={formData.height} onChange={e => setFormData({...formData, height: e.target.value})} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0', width: '100%', boxSizing: 'border-box', minWidth: 0 }} />
              </div>
            </div>

            <button 
              onClick={handleFetchRates}
              disabled={preparing}
              style={{
                background: '#435b43',
                color: 'white',
                padding: '12px',
                borderRadius: '8px',
                border: 'none',
                fontWeight: 700,
                cursor: 'pointer',
                opacity: preparing ? 0.7 : 1
              }}
            >
              {preparing ? <Loader2 className="animate-spin inline mr-2" /> : <Truck className="inline mr-2" />}
              Fetch Courier Rates
            </button>

            {rates.length > 0 && (
              <div style={{ marginTop: '16px' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '12px' }}>Available Couriers:</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {rates.map((rate, i) => (
                    <div 
                      key={i} 
                      onClick={() => setSelectedCourier(rate)}
                      style={{
                        padding: '12px',
                        border: selectedCourier === rate ? '2px solid #435b43' : '1px solid #e2e8f0',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: selectedCourier === rate ? '#f0fdf4' : 'white'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {rate.courierImage && <img src={rate.courierImage} alt={rate.courierName} style={{ height: '24px' }} />}
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{rate.courierName}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{rate.planName} | TAT: {rate.tat} days</div>
                        </div>
                      </div>
                      <div style={{ fontWeight: 700, color: '#435b43' }}>₹{rate.total_freight || rate.total}</div>
                    </div>
                  ))}
                </div>

                <button 
                  onClick={handleBook}
                  disabled={booking || !selectedCourier}
                  style={{
                    marginTop: '24px',
                    width: '100%',
                    background: selectedCourier ? '#435b43' : '#cbd5e1',
                    color: 'white',
                    padding: '16px',
                    borderRadius: '8px',
                    border: 'none',
                    fontWeight: 700,
                    cursor: selectedCourier ? 'pointer' : 'not-allowed'
                  }}
                >
                  {booking ? <Loader2 className="animate-spin inline mr-2" /> : <Package className="inline mr-2" />}
                  Confirm & Book Shipment
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
