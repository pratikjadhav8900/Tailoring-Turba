export interface DeliveryEstimate {
  minDays: number;
  maxDays: number;
  label: string;
}

/**
 * Calculates estimated delivery time based on total order quantity.
 * Max displayed delivery time is capped at 15 days to maintain customer trust.
 */
export function getEstimatedDeliveryDays(totalQuantity: number): DeliveryEstimate {
  if (totalQuantity < 10) {
    return { minDays: 5, maxDays: 7, label: "5-7 Days" };
  } else if (totalQuantity < 5000) {
    return { minDays: 10, maxDays: 12, label: "10-12 Days" };
  } else {
    // Cap max delivery at 15 days for >5000 items
    return { minDays: 12, maxDays: 15, label: "12-15 Days" };
  }
}

/**
 * Returns a formatted date string range based on the order date and quantity.
 * e.g. "27 May - 29 May"
 */
export function getEstimatedDeliveryDateRange(orderDate: Date | string | number, totalQuantity: number): string {
  const { minDays, maxDays } = getEstimatedDeliveryDays(totalQuantity);
  
  const start = new Date(orderDate);
  start.setDate(start.getDate() + minDays);
  
  const end = new Date(orderDate);
  end.setDate(end.getDate() + maxDays);
  
  const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
  
  return `${start.toLocaleDateString('en-IN', options)} - ${end.toLocaleDateString('en-IN', options)}`;
}
