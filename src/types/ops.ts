import type {
  OpsProductionStage,
  OpsStageStatus,
  OrderStatus,
  Role,
  EventActorRole,
  PartnerType,
  PartnerService,
  AssignmentStatus,
  GoodsMovementType,
} from "@prisma/client";

export type {
  OpsProductionStage,
  OpsStageStatus,
  OrderStatus,
  Role,
  EventActorRole,
  PartnerType,
  PartnerService,
  AssignmentStatus,
  GoodsMovementType,
};

export type OpsPriority = "NORMAL" | "URGENT" | "RUSH";
export type OpsOrderSource =
  | "WEBSITE"
  | "TURBA_AI"
  | "MANUAL_OPS"
  | "WHATSAPP"
  | "NATURAL"
  | "PHONE"
  | "INSTAGRAM"
  | "REFERRAL"
  | (string & {});

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

  // Attached Quotation Document
  quotationUrl?: string | null;
  quotationFileName?: string | null;

  // Payments Ledger
  paymentTransactions?: OpsPaymentTransaction[];

  // External Vendor & Partner Assignments
  externalAssignments?: OpsExternalWorkAssignment[];
  goodsMovements?: OpsGoodsMovement[];
}

export interface OpsPaymentTransaction {
  id: string;
  orderId: string;
  amountPaise: number;
  currency: string;
  type: string;
  status: string;
  provider: string;
  providerPaymentId?: string | null;
  referenceNote?: string | null;
  createdAt: Date | string;
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

export interface OpsMonthlyActivity {
  name: string;
  monthIndex: number;
  revenue: number;
  orderCount: number;
  height: number;
  active?: boolean;
}

export interface OpsWorkerPerformance {
  id: string;
  name: string;
  employeeCode: string;
  roleTitle: string;
  completedTasks: number;
  inProgressTasks: number;
}

export interface OpsDashboardStats {
  totalActiveOrders: number;
  urgentOrdersCount: number;
  dueSoonCount: number; // Orders due within 48h
  stageCounts: Record<OpsProductionStage, number>;
  reworkCount: number; // Orders currently FLAGGED_REWORK
  completedTodayCount: number;
  grossRevenue: number;
  avgOrderValue: number;
  totalOrdersCount: number;
  totalPaidRevenue: number;
  totalPieces: number;
  totalRegisteredClients: number;
  taskPerformance: {
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    completionRate: number; // 0 - 100
  };
  workers: OpsWorkerPerformance[];
  monthlyActivity: OpsMonthlyActivity[];
  selectedYearAverageMonthlyRevenue: number;
  vendorMetrics?: {
    awaitingVendorAssignment: number;
    rawMaterialPending: number;
    goodsWithExternalPartners: number;
    overdueDeliveries: number;
    partiallyReceivedGoods: number;
    completedAwaitingNextStage?: number;
    activeVendorsCount: number;
  };
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

export interface OpsTaskItem {
  id: string;
  orderId: string;
  orderNumber: number;
  formattedOrderNumber: string;
  stage: OpsProductionStage;
  taskKey: string;
  title: string;
  status: OpsStageStatus;
  iteration: number;
  employeeId?: string | null;
  employeeName: string;
  assignedBy: string;
  instructions?: string;
  notes?: string | null;
  vendorName?: string | null;
  vendorCost?: number | null;
  startedAt?: Date | string | null;
  completedAt?: Date | string | null;
  createdAt: Date | string;
  orderCustomer?: string;
  orderCompany?: string | null;
  orderPriority?: OpsPriority;
  orderDueDate?: Date | string | null;
  orderTotalPieces?: number;
  orderStage?: OpsProductionStage | null;
  orderSource?: string | null;
}

export interface OpsVendorPartner {
  id: string;
  name: string;
  code?: string | null;
  partnerTypes: PartnerType[];
  services: PartnerService[];
  category?: string | null;
  subcategory?: string | null;
  products?: string | null;
  location?: string | null;
  normalizedLocation?: string | null;
  contactPersons?: string | null;
  phone?: string | null;
  email?: string | null;
  panNumber?: string | null;
  gstNumber?: string | null;
  isActive: boolean;
  sourceNotes?: string | null;
  internalNotes?: string | null;
  createdBy?: string | null;
  updatedBy?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  _count?: {
    assignments: number;
    goodsMovements: number;
  };
}

export interface OpsExternalWorkAssignment {
  id: string;
  orderId: string;
  orderNumber?: number;
  formattedOrderNumber?: string;
  vendorId: string;
  vendorName?: string;
  vendorCode?: string | null;
  vendorPhone?: string | null;
  vendorLocation?: string | null;
  stage: OpsProductionStage;
  stageExecutionId?: string | null;
  assignedById?: string | null;
  assignedByName?: string | null;
  assignedWorkerId?: string | null;
  assignedWorkerName?: string | null;
  workType: string;
  assignmentType?: string;
  serviceOrProduct?: string | null;
  serviceRequested?: string | null;
  materialSpecs?: string | null;
  unit?: string | null;
  quantityRequired?: number | null;
  quantitySent: number;
  quantityReceived: number;
  pendingQuantity: number;
  expectedDeliveryDate?: Date | string | null;
  status: AssignmentStatus;
  notes?: string | null;
  specifications?: Record<string, unknown> | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  goodsMovements?: OpsGoodsMovement[];
}

export interface OpsGoodsMovement {
  id: string;
  assignmentId: string;
  orderId: string;
  orderNumber?: number;
  vendorId: string;
  vendorName?: string;
  movementType: GoodsMovementType;
  quantity: number;
  discrepancyQuantity: number;
  challanNumber?: string | null;
  movementDate: Date | string;
  actorEmployeeId?: string | null;
  actorEmployeeName: string;
  employeeName?: string | null;
  notes?: string | null;
  conditionNotes?: string | null;
  attachments: string[];
  createdAt: Date | string;
}

export interface OpsMaterialConsumptionReference {
  id: string;
  productType: string;
  sizeBand: string;
  fabric: string;
  gsm?: string | null;
  unitKg?: number | null;
  unitsPerKg?: number | null;
  sourceQuantity?: number | null;
  sourceFabricRequiredKg?: number | null;
  supplierBrandNote?: string | null;
  sourceDocument: string;
  notes?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

