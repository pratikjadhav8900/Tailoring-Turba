export interface TurbaCustomerContext {
  intent?: "quote" | "custom_order" | "bulk_inquiry" | "explore";
  garmentType?: "tshirt" | "polo" | "hoodie" | "sweatshirt" | "uniform" | "sportswear" | "corporate" | string;
  useCase?: "employees" | "event" | "promotional" | "college" | "sports" | "merchandise" | string;
  audience?: "men" | "women" | "kids" | "unisex";
  quantity?: number;
  fit?: "regular" | "oversized" | "polo" | "slim";
  collarType?: "round-neck" | "collar" | "v-neck" | "hooded" | string;
  fabricType?: "100% cotton" | "poly-cotton" | "100% polyester" | string;
  fabricPreference?: string;
  gsm?: number | string;
  color?: string;
  brandingRequired?: boolean;
  logoPlacement?: "left-chest" | "center-chest" | "back" | "sleeve" | "multiple";
  printingMethod?: "embroidery" | "screen" | "dtf" | "dtg" | "sublimation";
  selectedProductId?: string;
  selectedProductName?: string;
  sizeBreakdown?: Record<string, number>;
  notes?: string;
}

export interface TurbaQuickOption {
  label: string;
  value: string;
  category?: string;
}

export interface RecommendedProduct {
  id: string | number;
  name: string;
  category?: string;
  type?: string;
  image: string;
  price: number;
  minOrderQuantity: number;
  features?: string[];
  fabric?: string;
  badge?: string;
  colors?: number;
}

export interface TurbaMessage {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: number;
  quickOptions?: TurbaQuickOption[];
  recommendedProducts?: RecommendedProduct[];
  consultantSummary?: {
    garment?: string;
    fabric?: string;
    branding?: string;
    printMethod?: string;
    quantity?: number;
    readyToCustomize?: boolean;
  };
}

export interface TurbaAiState {
  isOpen: boolean;
  isMinimized: boolean;
  messages: TurbaMessage[];
  context: TurbaCustomerContext;
  isTyping: boolean;
  error: string | null;
}
