import React from 'react';
import {
  CheckCircle2,
  Layers,
  PackageCheck,
  Truck,
  Navigation,
  MapPin,
  Home,
  XCircle,
} from 'lucide-react';
import styles from './OrderTracking.module.css';

interface OrderTrackingProps {
  status: string;
  shipmentStatus?: string | null;
  currentStageKey?: string;
}

export const STAGES = [
  { key: 'ORDER_PLACED', label: 'Order Placed', icon: CheckCircle2 },
  { key: 'IN_PRODUCTION', label: 'In Production', icon: Layers },
  { key: 'READY_TO_SHIP', label: 'Ready to Ship', icon: PackageCheck },
  { key: 'DISPATCHED', label: 'Dispatched', icon: Truck },
  { key: 'IN_TRANSIT', label: 'In Transit', icon: Navigation },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', icon: MapPin },
  { key: 'DELIVERED', label: 'Delivered', icon: Home },
];

export function deriveActiveStageIndex(orderStatus: string, shipmentStatus?: string | null): number {
  if (orderStatus === 'DELIVERED' || shipmentStatus === 'DELIVERED') return 6;
  if (shipmentStatus === 'OUT_FOR_DELIVERY') return 5;
  if (shipmentStatus === 'IN_TRANSIT') return 4;
  if (orderStatus === 'DISPATCHED' || orderStatus === 'SHIPPED' || shipmentStatus === 'BOOKED' || shipmentStatus === 'PICKED_UP') return 3;
  if (orderStatus === 'READY_TO_SHIP') return 2;
  if (orderStatus === 'IN_PRODUCTION' || orderStatus === 'QUALITY_CHECK' || orderStatus === 'PROCESSING') return 1;
  return 0; // ORDER_PLACED
}

const OrderTracking: React.FC<OrderTrackingProps> = ({ status, shipmentStatus, currentStageKey }) => {
  if (status === 'CANCELLED') {
    return (
      <div className={styles.cancelledState}>
        <XCircle size={20} color="#dc2626" />
        <span>This order has been cancelled</span>
      </div>
    );
  }

  let activeIndex = 0;
  if (currentStageKey) {
    const foundIdx = STAGES.findIndex((s) => s.key === currentStageKey);
    if (foundIdx !== -1) activeIndex = foundIdx;
  } else {
    activeIndex = deriveActiveStageIndex(status, shipmentStatus);
  }

  return (
    <div className={styles.container}>
      <div className={styles.track}>
        {STAGES.map((stage, index) => {
          const isCompleted = index < activeIndex;
          const isActive = index === activeIndex;
          const isUpcoming = index > activeIndex;
          const Icon = stage.icon;

          return (
            <div
              key={stage.key}
              className={`${styles.step} ${isCompleted ? styles.completed : ''} ${
                isActive ? styles.active : ''
              } ${isUpcoming ? styles.upcoming : ''}`}
            >
              <div className={styles.iconWrapper}>
                <Icon size={18} />
              </div>
              <span className={styles.label}>{stage.label}</span>
              {index < STAGES.length - 1 && (
                <div className={styles.connector}>
                  <div
                    className={styles.connectorProgress}
                    style={{ width: isCompleted ? '100%' : '0%' }}
                  ></div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OrderTracking;
