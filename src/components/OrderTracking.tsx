import React from 'react';
import { CheckCircle2, Package, Truck, Home, XCircle } from 'lucide-react';
import styles from './OrderTracking.module.css';

interface OrderTrackingProps {
  status: string;
}

const OrderTracking: React.FC<OrderTrackingProps> = ({ status }) => {
  const steps = [
    { key: 'PENDING', label: 'Order Placed', icon: <CheckCircle2 size={20} /> },
    { key: 'PROCESSING', label: 'Processing', icon: <Package size={20} /> },
    { key: 'SHIPPED', label: 'Shipped', icon: <Truck size={20} /> },
    { key: 'DELIVERED', label: 'Delivered', icon: <Home size={20} /> },
  ];

  if (status === 'CANCELLED') {
    return (
      <div className={styles.cancelledState}>
        <XCircle size={20} color="#dc2626" />
        <span>This order has been cancelled</span>
      </div>
    );
  }

  const currentStepIndex = steps.findIndex(s => s.key === status);
  // Default to first step if not found
  const activeIndex = currentStepIndex === -1 ? 0 : currentStepIndex;

  return (
    <div className={styles.container}>
      <div className={styles.track}>
        {steps.map((step, index) => {
          const isCompleted = index < activeIndex;
          const isActive = index === activeIndex;
          const isUpcoming = index > activeIndex;

          return (
            <div 
              key={step.key} 
              className={`${styles.step} ${styles[step.key]} ${isCompleted ? styles.completed : ''} ${isActive ? styles.active : ''} ${isUpcoming ? styles.upcoming : ''}`}
            >
              <div className={styles.iconWrapper}>
                {step.icon}
              </div>
              <span className={styles.label}>{step.label}</span>
              {index < steps.length - 1 && (
                <div className={styles.connector}>
                  <div className={styles.connectorProgress} style={{ width: isCompleted ? '100%' : '0%' }}></div>
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
