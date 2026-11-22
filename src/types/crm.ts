import type {
  LeadSource,
  LeadStage,
  LeadActivityType,
  LeadTaskType,
  LeadTaskPriority,
  LeadTaskStatus,
} from "@prisma/client";

export type { LeadSource, LeadStage, LeadActivityType, LeadTaskType, LeadTaskPriority, LeadTaskStatus };

export interface CrmEmployee {
  id: string;
  employeeCode: string;
  name: string;
  email: string;
  phone?: string | null;
  roleTitle: string;
  department?: string | null;
  isActive: boolean;
  userId?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface CrmLeadActivity {
  id: string;
  leadId: string;
  type: LeadActivityType;
  note?: string | null;
  employeeId?: string | null;
  employeeName?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: Date | string;
}

export interface CrmLeadTask {
  id: string;
  leadId: string;
  lead?: { id: string; name: string; companyName?: string | null } | null;
  type: LeadTaskType;
  title: string;
  description?: string | null;
  dueAt: Date | string;
  priority: LeadTaskPriority;
  status: LeadTaskStatus;
  assignedToId?: string | null;
  assignedTo?: { id: string; name: string } | null;
  createdById?: string | null;
  completionNotes?: string | null;
  completedAt?: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface CrmLeadTag {
  id: string;
  name: string;
  color?: string | null;
}

export type LeadQuality = "HOT" | "WARM" | "COLD";

export function getLeadQuality(score: number): LeadQuality {
  if (score >= 8) return "HOT";
  if (score >= 4) return "WARM";
  return "COLD";
}

export interface CrmLead {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  companyName?: string | null;
  source: LeadSource;
  sourceDetail?: string | null;
  externalLeadId?: string | null;
  status: LeadStage;
  score: number;
  isFavourite: boolean;
  requirements?: string | null;
  quantity?: number | null;
  city?: string | null;
  notes?: string | null;
  productCategory?: string | null;
  expectedValue?: number | null;
  lostReason?: string | null;
  assignedToId?: string | null;
  assignedTo?: { id: string; name: string; employeeCode: string } | null;
  createdById?: string | null;
  createdBy?: { id: string; name: string } | null;
  convertedUserId?: string | null;
  convertedAt?: Date | string | null;
  lastContactedAt?: Date | string | null;
  nextFollowUpAt?: Date | string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  activities?: CrmLeadActivity[];
  tasks?: CrmLeadTask[];
  tags?: { tag: CrmLeadTag }[];
  openTaskCount?: number;
  lastActivityAt?: Date | string | null;
}

export const LEAD_STAGE_LABELS: Record<LeadStage, string> = {
  NEW_LEAD: "New Lead",
  DNP: "DNP (Did Not Pick)",
  INTERESTED: "Interested",
  NOT_INTERESTED: "Not Interested",
  CONVERTED: "Converted",
  CLOSED: "Closed",
};

export const LEAD_STAGE_ORDER: LeadStage[] = ["NEW_LEAD", "DNP", "INTERESTED", "NOT_INTERESTED", "CONVERTED", "CLOSED"];

// Terminal "won" states for reporting: a deal counts as won whether it's
// still Converted or has since been wrapped up as Closed.
export const WON_STAGES: LeadStage[] = ["CONVERTED", "CLOSED"];

export const LEAD_SOURCE_LABELS: Record<LeadSource, string> = {
  META_ADS: "Meta Ads",
  GOOGLE_ADS: "Google Ads",
  WEBSITE: "Website",
  REFERRAL: "Referral",
  OLD_CUSTOMER_DATA: "Old Customer Data",
  WALK_IN: "Walk-in",
  PHONE_INQUIRY: "Phone Inquiry",
  WHATSAPP: "WhatsApp",
  INSTAGRAM: "Instagram",
  OTHER: "Other",
};

export const PRODUCT_CATEGORIES = [
  "T-Shirts",
  "Polo T-Shirts",
  "Hoodies",
  "Sweatshirts",
  "Uniforms",
  "Shirts",
  "Jackets",
  "Corporate Gifts",
  "Bottles",
  "Diaries",
  "Pens",
  "Caps",
  "Bags",
  "Promotional Merchandise",
  "Other Customized Products",
];

export const LEAD_TASK_TYPE_LABELS: Record<LeadTaskType, string> = {
  FOLLOW_UP_CALL: "Follow-up Call",
  SEND_QUOTATION: "Send Quotation",
  SEND_WHATSAPP: "Send WhatsApp Message",
  SEND_EMAIL: "Send Email",
  SCHEDULE_MEETING: "Schedule Meeting",
  REQUIREMENT_COLLECTION: "Requirement Collection",
  PRICE_NEGOTIATION: "Price Negotiation",
  SAMPLE_FOLLOW_UP: "Sample Follow-up",
  PAYMENT_FOLLOW_UP: "Payment Follow-up",
  ORDER_CONFIRMATION: "Order Confirmation",
  CUSTOM: "Custom Task",
};
