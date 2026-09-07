/**
 * Tailoring Turba — 7 Customer-Facing Order Stages
 * 
 * Order Placed → In Production → Ready to Ship → Dispatched → In Transit → Out for Delivery → Delivered
 */

export interface TrackingStageDefinition {
  key: string;
  label: string;
  description: string;
}

export const CUSTOMER_STAGES: TrackingStageDefinition[] = [
  { key: "ORDER_PLACED", label: "Order Placed", description: "Order confirmed & advance payment received" },
  { key: "IN_PRODUCTION", label: "In Production", description: "Garment cutting, stitching & tailoring" },
  { key: "READY_TO_SHIP", label: "Ready to Ship", description: "Garments packed & quality checked" },
  { key: "DISPATCHED", label: "Dispatched", description: "Handed over to carrier & Tax Invoice issued" },
  { key: "IN_TRANSIT", label: "In Transit", description: "Package moving through logistics hubs" },
  { key: "OUT_FOR_DELIVERY", label: "Out for Delivery", description: "Package on vehicle for final delivery" },
  { key: "DELIVERED", label: "Delivered", description: "Package successfully delivered" },
];

export function deriveTrackingStage(
  orderStatus: string,
  shipmentStatus?: string | null
): { stageKey: string; stageIndex: number } {
  if (orderStatus === "DELIVERED" || shipmentStatus === "DELIVERED") {
    return { stageKey: "DELIVERED", stageIndex: 7 };
  }
  if (shipmentStatus === "OUT_FOR_DELIVERY") {
    return { stageKey: "OUT_FOR_DELIVERY", stageIndex: 6 };
  }
  if (shipmentStatus === "IN_TRANSIT") {
    return { stageKey: "IN_TRANSIT", stageIndex: 5 };
  }
  if (orderStatus === "DISPATCHED" || orderStatus === "SHIPPED" || shipmentStatus === "BOOKED" || shipmentStatus === "PICKED_UP") {
    return { stageKey: "DISPATCHED", stageIndex: 4 };
  }
  if (orderStatus === "READY_TO_SHIP") {
    return { stageKey: "READY_TO_SHIP", stageIndex: 3 };
  }
  if (orderStatus === "IN_PRODUCTION" || orderStatus === "QUALITY_CHECK" || orderStatus === "PROCESSING") {
    return { stageKey: "IN_PRODUCTION", stageIndex: 2 };
  }
  return { stageKey: "ORDER_PLACED", stageIndex: 1 };
}
