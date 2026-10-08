import type {
  OpsProductionStage,
  OpsStageStatus,
  OrderStatus,
  Role,
  EventActorRole,
} from "@prisma/client";

export type { OpsProductionStage, OpsStageStatus, OrderStatus, Role, EventActorRole };

export type OpsPriority = "NORMAL" | "URGENT" | "RUSH";
export type OpsOrderSource = "WEBSITE" | "TURBA_AI" | "MANUAL_OPS";

export interface OpsEmployee {
  id: string;
  employeeCode: string;
  name: string;
  email: string;
  phone?: string | null;
  roleTitle: string; // Informational display only (equal authority in V1)
  isActive: boolean;
  userId?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface OpsCustomizerSpec {
  sizes?: Record<string, number>; // e.g. { S: 10, M: 20, L: 15, XL: 5 }
  printLocations?: {
    front?: boolean;
    back?: boolean;
    leftSleeve?: boolean;
    rightSleeve?: boolean;
  };
  printTechnology?: string; // DTF, Screen, Embroidery
  fabricNotes?: string;
  [key: string]: unknown;
}

export interface OpsOrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  productSku?: string | null;
  fabric?: string | null;
  gsm?: number | null;
  fit?: string | null;
  quantity: number;
  price: number;
  customState?: OpsCustomizerSpec | null;
  printFiles: string[];
  mockupUrl?: string | null;
  mockupUrlBack?: string | null;
  mockupUrlLeft?: string | null;
  mockupUrlRight?: string | null;
}

export interface OpsProductionStageExecution {
  id: string;
  orderId: string;
  stage: OpsProductionStage;
  status: OpsStageStatus;
  iteration: number;
  employeeId?: string | null;
  employeeName: string;
  notes?: string | null;
  metadata?: Record<string, unknown> | null;
  attachments: string[];
  startedAt?: Date | string | null;
  completedAt?: Date | string | null;
  createdAt: Date | string;
}

export interface OpsInternalOrderNote {
  id: string;
  orderId: string;
  employeeId?: string | null;
  employeeName: string;
  note: string;
  isPinned: boolean;
  createdAt: Date | string;
}

export interface OpsCustomerSummary {
  id: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  companyName?: string | null;
  gstNumber?: string | null;
}

export interface OpsShippingAddress {
  id: string;
  name: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface OpsOrder {
  id: string;
  orderNumber: number; // e.g. 1048 -> display as TT-1048
  formattedOrderNumber: string; // "TT-1048"
  totalAmount: number;
  amountPaid: number;
  remainingAmount: number;
  status: OrderStatus; // Legacy/Public order status
  opsStage: OpsProductionStage | null; // NULL for historical orders; NEW_ORDER for ops orders
  dueDate: Date | string | null;
  priority: OpsPriority;
  orderSource: OpsOrderSource | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;

  // Customer & Address
  customer: OpsCustomerSummary;
  shippingAddress?: OpsShippingAddress | null;

  // Items & Customization
  items: OpsOrderItem[];
  totalQuantity: number;

  // Stage Executions & Notes
  stageExecutions: OpsProductionStageExecution[];
  currentExecution?: OpsProductionStageExecution | null;
  internalNotes: OpsInternalOrderNote[];

  // Logistics & Dispatch
  courierName?: string | null;
  awbNumber?: string | null;
  labelUrl?: string | null;
  manifestUrl?: string | null;
}

export interface OpsActivityEvent {
  id: string;
  orderId: string;
  eventType: string;
  title: string;
  description?: string | null;
  actorId?: string | null;
  actorName: string;
  actorRole: EventActorRole | string;
  metadata?: Record<string, unknown> | null;
  createdAt: Date | string;
}

export interface OpsNotificationItem {
  id: string;
  orderId?: string | null;
  orderNumber?: number | null;
  type: string;
  title: string;
  message: string;
  actorName: string;
  isReadByMe: boolean;
  readByCount: number;
  createdAt: Date | string;
}

export interface OpsDashboardStats {
  totalActiveOrders: number;
  urgentOrdersCount: number;
  dueSoonCount: number; // Orders due within 48h
  stageCounts: Record<OpsProductionStage, number>;
  reworkCount: number; // Orders currently FLAGGED_REWORK
  completedTodayCount: number;
}

export interface OpsStageTransitionPayload {
  targetStage: OpsProductionStage;
  notes?: string;
  metadata?: Record<string, unknown>;
  attachments?: string[];
  isOverride?: boolean;
  overrideReason?: string;
}

export interface OpsReworkPayload {
  targetStage: "RESOURCE_FABRIC" | "CUTTING" | "STITCHING" | "BRANDING_PRINTING";
  reason: string;
  notes?: string;
  attachments?: string[];
}
