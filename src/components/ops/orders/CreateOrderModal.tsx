"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Plus,
  MessageCircle,
  Phone,
  Compass,
  Camera,
  Globe,
  Share2,
  Calendar,
  AlertTriangle,
  Layers,
  Sparkles,
  MapPin,
  Check,
  ChevronDown,
  UploadCloud,
  FileText,
  CheckCircle2,
  Trash2,
  Paperclip,
  ExternalLink,
  Wand2,
  FileUp,
  Loader2,
} from "lucide-react";
import { OpsButton } from "../ui/OpsButton";
import type { ParsedQuotationItem } from "@/lib/ops/quotation-parser";

const LEAD_SOURCES = [
  { id: "WHATSAPP", label: "WhatsApp", icon: MessageCircle, color: "text-emerald-600 bg-emerald-50 border-emerald-300" },
  { id: "NATURAL", label: "Natural / Walk-in", icon: Compass, color: "text-blue-600 bg-blue-50 border-blue-300" },
  { id: "PHONE", label: "Phone Call", icon: Phone, color: "text-amber-600 bg-amber-50 border-amber-300" },
  { id: "INSTAGRAM", label: "Instagram", icon: Camera, color: "text-pink-600 bg-pink-50 border-pink-300" },
  { id: "WEBSITE", label: "Website", icon: Globe, color: "text-slate-600 bg-slate-50 border-slate-300" },
  { id: "REFERRAL", label: "Referral", icon: Share2, color: "text-purple-600 bg-purple-50 border-purple-300" },
];

interface CatalogProduct {
  id: string;
  name: string;
  basePrice: number;
  fabric?: string | null;
  gsm?: number | null;
}

interface UploadedAsset {
  url: string;
  fileName: string;
  fileSize: number;
  fileType: string;
}

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCreated: (orderId?: string) => void;
}

export const CreateOrderModal: React.FC<CreateOrderModalProps> = ({
  isOpen,
  onClose,
  onOrderCreated,
}) => {
  // Source & Priority
  const [orderSource, setOrderSource] = useState("WHATSAPP");
  const [priority, setPriority] = useState<"NORMAL" | "URGENT" | "RUSH">("NORMAL");
  const [dueDate, setDueDate] = useState<string>("");

  // Customer Details (pre-filled with quotation specs; operator can click 'Reset to Blank' anytime)
  const [customerName, setCustomerName] = useState("Spruce Up Industries");
  const [customerPhone, setCustomerPhone] = useState("9359435158");
  const [customerEmail, setCustomerEmail] = useState("");
  const [companyName, setCompanyName] = useState("Spruce Up Industries");
  const [gstNumber, setGstNumber] = useState("27AAXCS3922M1ZJ");

  // Catalog Products
  const [catalogProducts, setCatalogProducts] = useState<CatalogProduct[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>("");

  // Line Items with structured Tailoring Turba production parameters
  const [items, setItems] = useState<ParsedQuotationItem[]>([
    {
      productName: "Customised T-shirt",
      fabric: "Interlock",
      brand: "",
      garmentType: "Polo",
      color: "Black",
      logoRequired: true,
      logoName: "Spruce Up",
      logoType: "Embroidery",
      logoPosition: "Left Chest + Sleeves + Back Center",
      sizeRange: "S - 2XL",
      sizeNote: "If size above 2XL, 45rs extra will be charged per piece",
      price: 700,
      quantity: 40,
      total: 28000,
      sizeBreakdown: { S: 8, M: 8, L: 8, XL: 8, "2XL": 8, "3XL": 0 },
      branding: "Embroidery - Logo: Spruce Up - Left Chest + Sleeves + Back Center",
    },
  ]);
  const [activeItemIndex, setActiveItemIndex] = useState(0);

  // Financials
  const [customTotalAmount, setCustomTotalAmount] = useState<number | null>(null);
  const [amountPaid, setAmountPaid] = useState<number>(16800);
  const [internalNote, setInternalNote] = useState(
    "Quotation Ref: #452 | Payment terms: 60% advance | Logo format: CDR vector file required"
  );

  // Shipping Address
  const [showAddress, setShowAddress] = useState(true);
  const [street, setStreet] = useState("Shed No. 1 2 3, Survey NO.44, Matosrhee garden, Kondhwa, Pisoli Rd, Pisoli");
  const [city, setCity] = useState("Pune");
  const [state, setState] = useState("Maharashtra");
  const [pincode, setPincode] = useState("411060");

  // Quotation Upload & AI Parse
  const [isParsingQuotation, setIsParsingQuotation] = useState(false);
  const [quotationSuccessMsg, setQuotationSuccessMsg] = useState<string | null>(null);
  const [uploadedQuotationFile, setUploadedQuotationFile] = useState<{
    url: string;
    fileName: string;
    fileSize?: number;
  } | null>(null);
  const [showPasteText, setShowPasteText] = useState(false);
  const [pastedText, setPastedText] = useState("");
  const quotationFileInputRef = useRef<HTMLInputElement>(null);

  // Production Assets & Logos (CDR, AI, SVG, PNG, PDF)
  const [productionAssets, setProductionAssets] = useState<UploadedAsset[]>([]);
  const [isUploadingAsset, setIsUploadingAsset] = useState(false);
  const assetFileInputRef = useRef<HTMLInputElement>(null);

  // Submission States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Load catalog products
  useEffect(() => {
    async function loadProducts() {
      try {
        const res = await fetch("/api/products");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setCatalogProducts(data);
          }
        }
      } catch (err) {
        console.error("Failed to fetch products", err);
      }
    }
    if (isOpen) {
      loadProducts();
      // Set default dueDate 7 days from now if not already set
      if (!dueDate) {
        const d = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        setDueDate(d.toISOString().split("T")[0]);
      }
    }
  }, [isOpen]);

  // Active Item Helper
  const currentItem = items[activeItemIndex] || items[0] || {
    productName: "",
    quantity: 0,
    price: 0,
    total: 0,
    sizeBreakdown: { S: 0, M: 0, L: 0, XL: 0, "2XL": 0 },
  };

  const updateCurrentItem = (patch: Partial<ParsedQuotationItem>) => {
    setItems((prev) => {
      const copy = [...prev];
      if (!copy[activeItemIndex]) return prev;
      const updated = { ...copy[activeItemIndex], ...patch };
      // If sizes updated, recompute item quantity
      if (patch.sizeBreakdown) {
        updated.quantity = Object.values(patch.sizeBreakdown).reduce((sum, q) => sum + (Number(q) || 0), 0);
      }
      updated.total = (Number(updated.quantity) || 0) * (Number(updated.price) || 0);
      copy[activeItemIndex] = updated;
      return copy;
    });
  };

  const handleSizeChange = (sizeKey: string, val: string) => {
    const num = Math.max(0, parseInt(val, 10) || 0);
    const prevSizes = currentItem.sizeBreakdown || { S: 0, M: 0, L: 0, XL: 0, "2XL": 0 };
    updateCurrentItem({
      sizeBreakdown: { ...prevSizes, [sizeKey]: num },
    });
  };

  const handleAddNewItem = () => {
    const newItem: ParsedQuotationItem = {
      productName: "Customised T-shirt",
      fabric: "Interlock",
      brand: "",
      garmentType: "Polo",
      color: "Black",
      logoRequired: true,
      logoName: "Spruce Up",
      logoType: "Embroidery",
      logoPosition: "Left Chest + Sleeves + Back Center",
      sizeRange: "S - 2XL",
      sizeNote: "If size above 2XL, 45rs extra will be charged per piece",
      price: 0,
      quantity: 0,
      total: 0,
      sizeBreakdown: { S: 0, M: 0, L: 0, XL: 0, "2XL": 0, "3XL": 0 },
    };
    setItems((prev) => [...prev, newItem]);
    setActiveItemIndex(items.length);
  };

  const handleResetForm = () => {
    setCustomerName("");
    setCustomerPhone("");
    setCustomerEmail("");
    setCompanyName("");
    setGstNumber("");
    setStreet("");
    setCity("");
    setState("");
    setPincode("");
    setShowAddress(false);
    setCustomTotalAmount(null);
    setAmountPaid(0);
    setInternalNote("");
    setProductionAssets([]);
    setUploadedQuotationFile(null);
    setItems([
      {
        productName: "",
        fabric: "",
        brand: "",
        garmentType: "",
        color: "",
        logoRequired: false,
        logoName: "",
        logoType: "",
        logoPosition: "",
        sizeRange: "S - 2XL",
        sizeNote: "",
        price: 0,
        quantity: 0,
        total: 0,
        sizeBreakdown: { S: 0, M: 0, L: 0, XL: 0, "2XL": 0, "3XL": 0 },
      },
    ]);
    setActiveItemIndex(0);
  };

  const handleRemoveItem = (idx: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== idx));
    if (activeItemIndex >= idx) {
      setActiveItemIndex(Math.max(0, activeItemIndex - 1));
    }
  };

  // Totals across all line items
  const totalQuantity = items.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0);
  const calculatedTotalAmount = items.reduce((sum, it) => sum + (Number(it.total) || 0), 0);
  const finalTotalAmount = customTotalAmount !== null ? customTotalAmount : calculatedTotalAmount;
  const balanceRemaining = Math.max(0, finalTotalAmount - (Number(amountPaid) || 0));

  // Quick Advance Percentages
  const applyAdvancePercentage = (pct: number) => {
    const computed = Math.round(finalTotalAmount * (pct / 100));
    setAmountPaid(computed);
  };

  // --- Quotation File Upload / Parse Handler ---
  const handleQuotationFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsingQuotation(true);
    setError(null);
    setQuotationSuccessMsg(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/ops/quotation/parse", {
        method: "POST",
        body: formData,
      });

      let data: any = {};
      const resText = await res.text();
      try {
        data = JSON.parse(resText);
      } catch {
        throw new Error(
          res.status === 401
            ? "Your ops session expired. Please refresh the page or log in again."
            : `Server error (${res.status}). Please try again or paste quotation text.`
        );
      }

      if (!res.ok) {
        throw new Error(data.error || "Failed to parse quotation document.");
      }

      if (data.fileUrl) {
        setUploadedQuotationFile({
          url: data.fileUrl,
          fileName: data.fileName || file.name,
          fileSize: data.fileSize || file.size,
        });
      }

      applyParsedQuotation(data.quotation);
    } catch (err: any) {
      setError(err.message || "Failed to parse quotation. Please try manual entry or paste text.");
    } finally {
      setIsParsingQuotation(false);
      if (quotationFileInputRef.current) {
        quotationFileInputRef.current.value = "";
      }
    }
  };

  // --- Quotation Pasted Text Parse Handler ---
  const handleParsePastedText = async () => {
    if (!pastedText.trim() || pastedText.trim().length < 10) {
      setError("Please paste quotation details or table text to parse.");
      return;
    }

    setIsParsingQuotation(true);
    setError(null);
    setQuotationSuccessMsg(null);

    try {
      const res = await fetch("/api/ops/quotation/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: pastedText }),
      });

      let data: any = {};
      const resText = await res.text();
      try {
        data = JSON.parse(resText);
      } catch {
        throw new Error(
          res.status === 401
            ? "Your ops session expired. Please refresh the page or log in again."
            : `Server error (${res.status}). Please try again.`
        );
      }

      if (!res.ok) {
        throw new Error(data.error || "Failed to parse quotation text.");
      }

      applyParsedQuotation(data.quotation);
      setShowPasteText(false);
    } catch (err: any) {
      setError(err.message || "Failed to parse text. Please check format.");
    } finally {
      setIsParsingQuotation(false);
    }
  };

  // Apply parsed quotation fields to state
  const applyParsedQuotation = (q: any) => {
    if (!q) return;

    if (q.customerName || q.companyName) {
      setCustomerName(q.companyName || q.customerName);
    }
    if (q.companyName) {
      setCompanyName(q.companyName);
    }
    if (q.customerPhone) {
      setCustomerPhone(q.customerPhone);
    }
    if (q.customerEmail) {
      setCustomerEmail(q.customerEmail);
    }
    if (q.customerGstNumber) {
      setGstNumber(q.customerGstNumber);
    }

    if (q.shippingAddress) {
      setStreet(q.shippingAddress.street || "");
      setCity(q.shippingAddress.city || "");
      setState(q.shippingAddress.state || "");
      setPincode(q.shippingAddress.postalCode || "");
      setShowAddress(true);
    }

    if (q.dueDate) {
      try {
        const d = new Date(q.dueDate);
        if (!isNaN(d.getTime())) {
          setDueDate(d.toISOString().split("T")[0]);
        }
      } catch (_) {}
    }

    if (q.totalAmount && Number(q.totalAmount) > 0) {
      setCustomTotalAmount(Number(q.totalAmount));
    }

    if (q.amountPaid && Number(q.amountPaid) > 0) {
      setAmountPaid(Number(q.amountPaid));
    } else if (q.totalAmount) {
      // Default 60% advance
      setAmountPaid(Math.round(Number(q.totalAmount) * 0.6));
    }

    if (q.internalNote) {
      setInternalNote((prev) => (prev ? `${prev}\n${q.internalNote}` : q.internalNote));
    }

    if (Array.isArray(q.items) && q.items.length > 0) {
      setItems(q.items);
      setActiveItemIndex(0);
    }

    setQuotationSuccessMsg(
      `Quotation #${q.quotationNumber || "Auto"} successfully detected! ${
        q.items?.length || 0
      } line items, ₹${Number(q.totalAmount || 0).toLocaleString()} total, and ₹${Number(
        q.amountPaid || 0
      ).toLocaleString()} (${q.advancePercentage || 60}% advance) populated.`
    );
  };

  // --- Production Asset (Logos, CDR, Vectors) Upload Handler ---
  const handleAssetUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingAsset(true);
    setError(null);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/ops/upload", {
          method: "POST",
          body: formData,
        });

        let data: any = {};
        const resText = await res.text();
        try {
          data = JSON.parse(resText);
        } catch {
          throw new Error(
            res.status === 401
              ? "Your ops session expired. Please refresh the page or log in again."
              : `Upload server error (${res.status}).`
          );
        }

        if (!res.ok) {
          throw new Error(data.error || `Failed to upload ${file.name}`);
        }

        if (data.asset) {
          setProductionAssets((prev) => [...prev, data.asset]);
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to upload asset file.");
    } finally {
      setIsUploadingAsset(false);
      if (assetFileInputRef.current) {
        assetFileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveAsset = (index: number) => {
    setProductionAssets((prev) => prev.filter((_, i) => i !== index));
  };

  // --- Form Submission ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!customerName.trim()) {
      setError("Please provide customer or company name.");
      return;
    }
    if (!customerPhone.trim()) {
      setError("Please provide customer phone/WhatsApp number.");
      return;
    }
    if (totalQuantity <= 0) {
      setError("Please enter size quantities (at least 1 piece).");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim() || undefined,
        customerCompanyName: companyName.trim() || undefined,
        customerGstNumber: gstNumber.trim() || undefined,
        orderSource,
        priority,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        totalAmount: finalTotalAmount,
        amountPaid: Math.min(finalTotalAmount, Math.max(0, Number(amountPaid) || 0)),
        internalNote: internalNote.trim() || undefined,
        productionAssets: productionAssets.map((a) => a.url),
        quotationUrl: uploadedQuotationFile?.url || undefined,
        quotationFileName: uploadedQuotationFile?.fileName || undefined,
        shippingAddress:
          showAddress && (street || city)
            ? {
                street,
                city,
                state,
                postalCode: pincode,
                country: "India",
              }
            : undefined,
        items: items.map((it) => ({
          productId: selectedProductId || undefined,
          productName: it.productName || "Custom Garment",
          quantity: it.quantity,
          price: it.price,
          fabric: it.fabric,
          brand: it.brand,
          garmentType: it.garmentType,
          color: it.color,
          logoRequired: it.logoRequired,
          logoName: it.logoName,
          logoType: it.logoType,
          logoPosition: it.logoPosition,
          sizeRange: it.sizeRange,
          sizeNote: it.sizeNote,
          branding:
            it.branding ||
            [it.logoType, it.logoName ? `Logo: ${it.logoName}` : "", it.logoPosition]
              .filter(Boolean)
              .join(" - "),
          sizeBreakdown: it.sizeBreakdown,
          printFiles: productionAssets.map((a) => a.url),
        })),
      };

      const res = await fetch("/api/ops/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create order");
      }

      onOrderCreated(data.order?.id);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to create order. Please check inputs.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm select-none overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-t-2xl sm:rounded-2xl border border-[#ECEEF2] shadow-2xl overflow-hidden my-0 sm:my-6 h-[94vh] sm:h-auto sm:max-h-[92vh] flex flex-col font-sans">
        {/* Header - Sticky so it never scrolls away or overlaps */}
        <div className="p-3.5 sm:p-5 border-b border-[#ECEEF2] flex items-center justify-between bg-white shrink-0 sticky top-0 z-20">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1 pr-2">
            <div className="w-8 h-8 rounded-lg bg-[#00A86B]/10 text-[#00A86B] flex items-center justify-center font-bold shrink-0">
              <Plus className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h2 className="text-sm font-bold text-[#111827] truncate">
                  New Production Order
                </h2>
                <span className="px-1.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[#00A86B] text-[9px] sm:text-[10px] font-bold shrink-0">
                  Direct Intake
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-[#6B7280] truncate">
                Record manual customer order with quotation auto-fill
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleResetForm}
              className="px-2 py-1 rounded-lg border border-[#E5E7EB] text-[10px] sm:text-[11px] font-semibold text-[#6B7280] hover:text-[#111827] hover:bg-[#F9FAFB] transition-colors whitespace-nowrap"
              title="Clear all fields to a blank form"
            >
              Reset
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-[#F3F4F6] text-[#6B7280] transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Form Container with Fixed Footer */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 flex flex-col min-h-0 overflow-hidden text-xs text-[#111827]"
        >
          {/* Scrollable Form Body */}
          <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 font-medium">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {quotationSuccessMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between gap-2 font-medium animate-fadeIn">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{quotationSuccessMsg}</span>
              </div>
              <button
                type="button"
                onClick={() => setQuotationSuccessMsg(null)}
                className="text-emerald-700 hover:text-emerald-900"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Section: Quotation Auto-Fill Dropzone */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-[#F8FAFC] via-[#F4F6F9] to-[#EFF6FF] border border-[#E2E8F0] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-[#2563EB]/10 text-[#2563EB] flex items-center justify-center font-bold">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-[#1E293B]">
                    Instant Quotation Auto-Fill
                  </h3>
                  <p className="text-[11px] text-[#64748B]">
                    Upload customer quotation PDF or image — auto-fills contact, items, rates & 60% advance
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowPasteText(!showPasteText)}
                className="text-[11px] font-semibold text-[#2563EB] hover:text-[#1D4ED8] flex items-center gap-1 hover:underline"
              >
                <FileText className="w-3 h-3" />
                <span>{showPasteText ? "Hide text paste" : "Paste text / WhatsApp"}</span>
              </button>
            </div>

            {/* Hidden file input */}
            <input
              type="file"
              ref={quotationFileInputRef}
              onChange={handleQuotationFileChange}
              accept=".pdf,image/png,image/jpeg,image/webp"
              className="hidden"
            />

            {/* Uploaded File Preview Card or Dropzone */}
            {uploadedQuotationFile ? (
              <div className="p-3.5 rounded-xl bg-white border border-[#CBD5E1] shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 border border-red-200 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-red-500" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-[#1E293B] truncate max-w-[200px] sm:max-w-xs">
                        {uploadedQuotationFile.fileName}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Quotation Attached
                      </span>
                    </div>
                    <div className="text-[11px] text-[#64748B] flex items-center gap-2 mt-0.5">
                      {uploadedQuotationFile.fileSize ? (
                        <span>{(uploadedQuotationFile.fileSize / 1024).toFixed(0)} KB</span>
                      ) : null}
                      <span>•</span>
                      <span>Auto-filled & saved with order</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 justify-end">
                  <a
                    href={uploadedQuotationFile.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>View PDF</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => quotationFileInputRef.current?.click()}
                    className="px-2.5 py-1.5 rounded-lg border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#475569] text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    <FileUp className="w-3.5 h-3.5" />
                    <span>Replace</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadedQuotationFile(null)}
                    className="p-1.5 rounded-lg text-[#94A3B8] hover:text-red-500 hover:bg-red-50 transition-colors"
                    title="Remove quotation document"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              /* Dropzone button */
              <div
                onClick={() => quotationFileInputRef.current?.click()}
                className={`p-4 border-2 border-dashed rounded-xl cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                  isParsingQuotation
                    ? "border-[#2563EB] bg-[#EFF6FF]"
                    : "border-[#CBD5E1] hover:border-[#2563EB] bg-white hover:bg-[#F8FAFC]"
                }`}
              >
                {isParsingQuotation ? (
                  <div className="flex items-center gap-2 text-[#2563EB] font-bold text-xs py-1">
                    <Loader2 className="w-4 h-4 animate-spin text-[#2563EB]" />
                    <span>Scanning Quotation PDF & Extracting Garment Specifications...</span>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2 text-[#334155] font-semibold">
                      <UploadCloud className="w-5 h-5 text-[#2563EB]" />
                      <span>Click to Upload Quotation (PDF, PNG, JPG)</span>
                    </div>
                    <div className="text-[11px] text-[#64748B]">
                      Supports official Vyapar / Tailoring Turba PDF quotes & scanned documents
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Optional Paste Text Box */}
            {showPasteText && (
              <div className="pt-2 space-y-2 border-t border-[#E2E8F0]">
                <textarea
                  rows={3}
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder="Paste quotation table, WhatsApp order summary, or customer specifications here..."
                  className="w-full bg-white border border-[#CBD5E1] rounded-xl p-2.5 text-xs text-[#1E293B] outline-none font-mono focus:border-[#2563EB]"
                />
                <div className="flex justify-end">
                  <OpsButton
                    variant="primary"
                    size="sm"
                    type="button"
                    disabled={isParsingQuotation}
                    onClick={handleParsePastedText}
                    leftIcon={<Wand2 className="w-3 h-3" />}
                  >
                    Auto-Fill from Pasted Text
                  </OpsButton>
                </div>
              </div>
            )}
          </div>

          {/* Section 1: Lead Source Tag */}
          <div>
            <label className="block text-xs font-semibold text-[#374151] mb-2">
              Lead Source Tag <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {LEAD_SOURCES.map((src) => {
                const Icon = src.icon;
                const isSelected = orderSource === src.id;
                return (
                  <button
                    key={src.id}
                    type="button"
                    onClick={() => setOrderSource(src.id)}
                    className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all text-xs font-semibold ${
                      isSelected
                        ? `${src.color} border-current shadow-xs ring-1 ring-current`
                        : "bg-[#F9FAFB] border-[#E5E7EB] text-[#4B5563] hover:bg-white hover:border-[#D1D5DB]"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{src.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Customer Information */}
          <div className="space-y-3 pt-2 border-t border-[#F3F4F6]">
            <h3 className="text-xs font-bold text-[#374151] uppercase tracking-wider">
              Customer Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-[#4B5563] mb-1">
                  Customer / Contact Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Spruce Up Industries"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-[#F9FAFB] border border-[#E5E7EB] focus:bg-white focus:border-[#111827] rounded-xl px-3 py-2 text-xs outline-none transition-all"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#4B5563] mb-1">
                  WhatsApp / Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 9359435158"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full bg-[#F9FAFB] border border-[#E5E7EB] focus:bg-white focus:border-[#111827] rounded-xl px-3 py-2 text-xs outline-none transition-all"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#4B5563] mb-1">
                  Company / Brand Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Spruce Up Industries"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full bg-[#F9FAFB] border border-[#E5E7EB] focus:bg-white focus:border-[#111827] rounded-xl px-3 py-2 text-xs outline-none transition-all"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#4B5563] mb-1">
                  Customer GSTIN
                </label>
                <input
                  type="text"
                  placeholder="e.g. 27AAXCS3922M1ZJ"
                  value={gstNumber}
                  onChange={(e) => setGstNumber(e.target.value)}
                  className="w-full bg-[#F9FAFB] border border-[#E5E7EB] focus:bg-white focus:border-[#111827] rounded-xl px-3 py-2 text-xs outline-none uppercase transition-all"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Garments & Line Items */}
          <div className="space-y-3 pt-2 border-t border-[#F3F4F6]">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-[#374151] uppercase tracking-wider">
                  Line Items & Sizing Breakdown
                </h3>
                <p className="text-[11px] text-[#6B7280]">
                  {items.length} item(s) • Total: {totalQuantity} pcs • ₹{calculatedTotalAmount.toLocaleString()}
                </p>
              </div>

              <OpsButton
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleAddNewItem}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                Add Item
              </OpsButton>
            </div>

            {/* Line items tab selector */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {items.map((it, idx) => (
                <div
                  key={idx}
                  onClick={() => setActiveItemIndex(idx)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer shrink-0 transition-all flex items-center gap-2 ${
                    activeItemIndex === idx
                      ? "bg-[#111827] text-white border-[#111827] shadow-xs"
                      : "bg-[#F9FAFB] text-[#4B5563] border-[#E5E7EB] hover:bg-white"
                  }`}
                >
                  <span className="truncate max-w-[140px]">{it.productName || `Item #${idx + 1}`}</span>
                  <span className="text-[10px] opacity-80">{it.quantity} pcs</span>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveItem(idx);
                      }}
                      className="opacity-60 hover:opacity-100 hover:text-red-300 ml-1"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Active Item Details with Structured Parameters */}
            <div className="p-4 rounded-xl border border-[#ECEEF2] bg-[#FAFAFA] space-y-4">
              {/* Row 1: Garment & Fabric Specification */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">
                    Garment & Fabric Specification
                  </span>
                  {currentItem.sizeRange && (
                    <span className="text-[10px] font-semibold text-[#2563EB] bg-[#EFF6FF] px-2 py-0.5 rounded-full border border-[#DBEAFE]">
                      {currentItem.sizeRange}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Garment Name / Style */}
                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-[#4B5563] mb-1">
                      Garment Name / Style <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Customised T-shirt"
                      value={currentItem.productName}
                      onChange={(e) => updateCurrentItem({ productName: e.target.value })}
                      className="w-full bg-white border border-[#E5E7EB] rounded-xl px-3 py-2 text-xs outline-none font-medium text-[#111827] focus:border-[#2563EB]"
                    />
                    <div className="flex flex-wrap gap-1 mt-1">
                      {["Customised T-shirt", "Customised Shirt", "Customised Uniforms", "Polo T-Shirt", "Hoodie"].map((style) => (
                        <button
                          key={style}
                          type="button"
                          onClick={() => updateCurrentItem({ productName: style })}
                          className={`text-[10px] px-2 py-0.5 rounded-md border transition-all ${
                            currentItem.productName === style
                              ? "bg-[#111827] text-white border-[#111827]"
                              : "bg-white text-[#6B7280] border-[#E5E7EB] hover:bg-[#F3F4F6]"
                          }`}
                        >
                          {style}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Garment Type / Cut */}
                  <div>
                    <label className="block font-semibold text-[#4B5563] mb-1">
                      Type / Cut
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Polo, Round Neck, Dungaree"
                      value={currentItem.garmentType || ""}
                      onChange={(e) => updateCurrentItem({ garmentType: e.target.value })}
                      className="w-full bg-white border border-[#E5E7EB] rounded-xl px-3 py-2 text-xs outline-none text-[#111827] focus:border-[#2563EB]"
                    />
                    <div className="flex flex-wrap gap-1 mt-1">
                      {["Polo", "Round Neck", "Oversized", "Dungaree", "Shirt"].map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => updateCurrentItem({ garmentType: t })}
                          className={`text-[10px] px-1.5 py-0.5 rounded border transition-all ${
                            currentItem.garmentType === t
                              ? "bg-[#2563EB] text-white border-[#2563EB]"
                              : "bg-white text-[#6B7280] border-[#E5E7EB] hover:bg-[#F3F4F6]"
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  {/* Fabric */}
                  <div>
                    <label className="block font-semibold text-[#4B5563] mb-1">
                      Fabric & Blend
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Interlock, 100% Cotton, Matty"
                      value={currentItem.fabric || ""}
                      onChange={(e) => updateCurrentItem({ fabric: e.target.value })}
                      className="w-full bg-white border border-[#E5E7EB] rounded-xl px-3 py-2 text-xs outline-none text-[#111827] focus:border-[#2563EB]"
                    />
                    <div className="flex flex-wrap gap-1 mt-1">
                      {["Interlock", "Polyester", "Cotton", "Matty", "Bio-wash"].map((f) => (
                        <button
                          key={f}
                          type="button"
                          onClick={() => updateCurrentItem({ fabric: f })}
                          className={`text-[10px] px-1.5 py-0.5 rounded border transition-all ${
                            currentItem.fabric === f
                              ? "bg-[#111827] text-white border-[#111827]"
                              : "bg-white text-[#6B7280] border-[#E5E7EB] hover:bg-[#F3F4F6]"
                          }`}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Brand */}
                  <div>
                    <label className="block font-semibold text-[#4B5563] mb-1">
                      Brand
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Mars 200, Jack & Jones"
                      value={currentItem.brand || ""}
                      onChange={(e) => updateCurrentItem({ brand: e.target.value })}
                      className="w-full bg-white border border-[#E5E7EB] rounded-xl px-3 py-2 text-xs outline-none text-[#111827] focus:border-[#2563EB]"
                    />
                    <div className="flex flex-wrap gap-1 mt-1">
                      {["In-house", "Mars 200", "Jack & Jones"].map((b) => (
                        <button
                          key={b}
                          type="button"
                          onClick={() => updateCurrentItem({ brand: b === "In-house" ? "" : b })}
                          className={`text-[10px] px-1.5 py-0.5 rounded border transition-all ${
                            (b === "In-house" && !currentItem.brand) || currentItem.brand === b
                              ? "bg-[#111827] text-white border-[#111827]"
                              : "bg-white text-[#6B7280] border-[#E5E7EB] hover:bg-[#F3F4F6]"
                          }`}
                        >
                          {b}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Garment Color */}
                  <div>
                    <label className="block font-semibold text-[#4B5563] mb-1">
                      Garment Color
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Black, Grey, White, Navy Blue"
                      value={currentItem.color || ""}
                      onChange={(e) => updateCurrentItem({ color: e.target.value })}
                      className="w-full bg-white border border-[#E5E7EB] rounded-xl px-3 py-2 text-xs outline-none text-[#111827] focus:border-[#2563EB]"
                    />
                    <div className="flex flex-wrap gap-1 mt-1">
                      {["Black", "Grey", "White", "Navy Blue"].map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => updateCurrentItem({ color: c })}
                          className={`text-[10px] px-1.5 py-0.5 rounded border transition-all ${
                            currentItem.color === c
                              ? "bg-[#111827] text-white border-[#111827]"
                              : "bg-white text-[#6B7280] border-[#E5E7EB] hover:bg-[#F3F4F6]"
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 2: Branding & Logo Specification */}
              <div className="p-3 rounded-xl bg-white border border-[#E5E7EB] space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#374151]">
                      Branding & Logo Specification
                    </span>
                  </div>

                  {/* Logo Required Toggle */}
                  <div className="flex items-center gap-1 bg-[#F3F4F6] p-0.5 rounded-lg border border-[#E5E7EB]">
                    <button
                      type="button"
                      onClick={() => updateCurrentItem({ logoRequired: true })}
                      className={`px-2.5 py-0.5 rounded text-[10px] font-bold transition-all ${
                        currentItem.logoRequired !== false
                          ? "bg-emerald-600 text-white shadow-xs"
                          : "text-[#6B7280] hover:text-[#111827]"
                      }`}
                    >
                      Logo Required: Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => updateCurrentItem({ logoRequired: false })}
                      className={`px-2.5 py-0.5 rounded text-[10px] font-bold transition-all ${
                        currentItem.logoRequired === false
                          ? "bg-slate-700 text-white shadow-xs"
                          : "text-[#6B7280] hover:text-[#111827]"
                      }`}
                    >
                      No Logo (Plain)
                    </button>
                  </div>
                </div>

                {currentItem.logoRequired !== false && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 border-t border-[#F3F4F6]">
                    {/* Logo Name */}
                    <div>
                      <label className="block font-semibold text-[#4B5563] mb-1">
                        Logo Name / Artwork
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Spruce Up"
                        value={currentItem.logoName || ""}
                        onChange={(e) => updateCurrentItem({ logoName: e.target.value })}
                        className="w-full bg-[#FAFAFA] border border-[#E5E7EB] rounded-lg px-2.5 py-1.5 text-xs outline-none text-[#111827] focus:border-[#2563EB]"
                      />
                    </div>

                    {/* Logo Type */}
                    <div>
                      <label className="block font-semibold text-[#4B5563] mb-1">
                        Logo Type / Technique
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Embroidery, DTF Print"
                        value={currentItem.logoType || ""}
                        onChange={(e) => updateCurrentItem({ logoType: e.target.value })}
                        className="w-full bg-[#FAFAFA] border border-[#E5E7EB] rounded-lg px-2.5 py-1.5 text-xs outline-none text-[#111827] focus:border-[#2563EB]"
                      />
                      <div className="flex flex-wrap gap-1 mt-1">
                        {["Embroidery", "DTF Print", "Screen Print", "Puff Print"].map((lt) => (
                          <button
                            key={lt}
                            type="button"
                            onClick={() => updateCurrentItem({ logoType: lt })}
                            className={`text-[9px] px-1.5 py-0.5 rounded border transition-all ${
                              currentItem.logoType === lt
                                ? "bg-[#2563EB] text-white border-[#2563EB]"
                                : "bg-white text-[#6B7280] border-[#E5E7EB] hover:bg-[#F3F4F6]"
                            }`}
                          >
                            {lt}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Position */}
                    <div>
                      <label className="block font-semibold text-[#4B5563] mb-1">
                        Placement / Position
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Left Chest + Sleeves + Back Center"
                        value={currentItem.logoPosition || ""}
                        onChange={(e) => updateCurrentItem({ logoPosition: e.target.value })}
                        className="w-full bg-[#FAFAFA] border border-[#E5E7EB] rounded-lg px-2.5 py-1.5 text-xs outline-none text-[#111827] focus:border-[#2563EB]"
                      />
                      <div className="flex flex-wrap gap-1 mt-1">
                        {["Left Chest", "Sleeves", "Back Center", "Left Chest + Sleeves + Back Center"].map((pos) => (
                          <button
                            key={pos}
                            type="button"
                            onClick={() => updateCurrentItem({ logoPosition: pos })}
                            className={`text-[9px] px-1.5 py-0.5 rounded border transition-all ${
                              currentItem.logoPosition === pos
                                ? "bg-[#111827] text-white border-[#111827]"
                                : "bg-white text-[#6B7280] border-[#E5E7EB] hover:bg-[#F3F4F6]"
                            }`}
                          >
                            {pos}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Row 3: Sizing Breakdown Matrix */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <label className="font-semibold text-[#4B5563]">
                      Size Quantities (Pcs)
                    </label>
                    <span className="text-[10px] text-[#6B7280]">
                      ({currentItem.sizeRange || "S - 2XL"})
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-[#111827] bg-[#F3F4F6] px-2 py-0.5 rounded-md border border-[#E5E7EB]">
                    Item Qty: {currentItem.quantity} pcs
                  </span>
                </div>

                <div className="grid grid-cols-6 gap-2">
                  {["S", "M", "L", "XL", "2XL", "3XL"].map((sz) => (
                    <div key={sz} className="text-center">
                      <div className="text-[10px] font-bold text-[#6B7280] mb-1 flex items-center justify-center gap-0.5">
                        <span>{sz}</span>
                        {sz === "3XL" && <span className="text-[9px] text-amber-600 font-semibold">(+₹45)</span>}
                      </div>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={currentItem.sizeBreakdown?.[sz] === 0 ? "" : currentItem.sizeBreakdown?.[sz] ?? ""}
                        onChange={(e) => handleSizeChange(sz, e.target.value)}
                        className="w-full text-center bg-white border border-[#E5E7EB] rounded-lg py-1.5 text-xs font-mono font-bold text-[#111827] focus:border-[#2563EB]"
                      />
                    </div>
                  ))}
                </div>

                {/* Surcharge Note / Production Rule */}
                <div>
                  <label className="block text-[11px] font-semibold text-[#4B5563] mb-1">
                    Size Note & Surcharges
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Note: If size above 2XL, 45rs extra will be charged per piece"
                    value={currentItem.sizeNote || ""}
                    onChange={(e) => updateCurrentItem({ sizeNote: e.target.value })}
                    className="w-full bg-white border border-[#E5E7EB] rounded-xl px-3 py-1.5 text-xs text-[#111827] outline-none focus:border-[#2563EB]"
                  />
                </div>
              </div>

              {/* Row 4: Rate & Item Total */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#E5E7EB]">
                <div>
                  <label className="block font-semibold text-[#4B5563] mb-1">
                    Rate per Piece (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={currentItem.price === 0 ? "" : currentItem.price || ""}
                    onChange={(e) =>
                      updateCurrentItem({ price: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full bg-white border border-[#E5E7EB] rounded-xl px-3 py-2 text-xs font-mono font-bold text-[#111827] focus:border-[#2563EB]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#4B5563] mb-1">
                    Line Item Total (₹)
                  </label>
                  <div className="w-full bg-white border border-[#E5E7EB] rounded-xl px-3 py-2 text-xs font-mono font-bold text-[#111827] flex items-center justify-between">
                    <span>₹{(currentItem.total || 0).toLocaleString()}</span>
                    <span className="text-[10px] text-[#6B7280] font-normal">
                      {currentItem.quantity} pcs × ₹{currentItem.price || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Production Assets & Logos (CDR, Vectors, PDF) */}
          <div className="space-y-3 pt-2 border-t border-[#F3F4F6]">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-[#374151] uppercase tracking-wider flex items-center gap-1.5">
                  <Paperclip className="w-3.5 h-3.5 text-[#00A86B]" />
                  <span>Production Assets & Logos</span>
                </h3>
                <p className="text-[11px] text-[#6B7280]">
                  Attach company logos, CDR vector files, embroidery DST, or artwork references
                </p>
              </div>

              <OpsButton
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => assetFileInputRef.current?.click()}
                disabled={isUploadingAsset}
                leftIcon={
                  isUploadingAsset ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <FileUp className="w-3.5 h-3.5" />
                  )
                }
              >
                {isUploadingAsset ? "Uploading..." : "Upload Logo / CDR"}
              </OpsButton>
            </div>

            <input
              type="file"
              ref={assetFileInputRef}
              onChange={handleAssetUpload}
              multiple
              accept=".cdr,.ai,.eps,.svg,.pdf,.png,.jpg,.jpeg,.psd,.zip"
              className="hidden"
            />

            {/* Assets List */}
            {productionAssets.length === 0 ? (
              <div
                onClick={() => assetFileInputRef.current?.click()}
                className="p-3 border border-dashed border-[#E5E7EB] rounded-xl text-center bg-[#F9FAFB] hover:bg-[#F3F4F6] cursor-pointer transition-colors text-xs text-[#6B7280]"
              >
                <span>No logo files uploaded yet. Click to attach CDR, SVG, or high-res logo.</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {productionAssets.map((asset, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl border border-[#E5E7EB] bg-white flex items-center justify-between gap-2 shadow-2xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#F3F4F6] text-[#374151]">
                        {asset.fileType || "FILE"}
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-[#111827] truncate">
                          {asset.fileName}
                        </div>
                        <div className="text-[10px] text-[#9CA3AF]">
                          {(asset.fileSize / 1024).toFixed(1)} KB
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <a
                        href={asset.url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1 text-[#6B7280] hover:text-[#111827]"
                        title="View Asset"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                      <button
                        type="button"
                        onClick={() => handleRemoveAsset(idx)}
                        className="p-1 text-[#6B7280] hover:text-red-500"
                        title="Remove Asset"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 5: Financials & Advance Calculation */}
          <div className="space-y-3 pt-2 border-t border-[#F3F4F6]">
            <h3 className="text-xs font-bold text-[#374151] uppercase tracking-wider">
              Financials & Advance Payments
            </h3>

            <div className="p-4 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-[#4B5563] mb-1">
                    Total Order Value (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={finalTotalAmount === 0 ? "" : finalTotalAmount || ""}
                    onChange={(e) => setCustomTotalAmount(parseFloat(e.target.value) || 0)}
                    className="w-full bg-white border border-[#E5E7EB] rounded-xl px-3 py-2 text-xs font-mono font-extrabold text-[#111827]"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-[#4B5563]">
                      Advance Received (₹)
                    </label>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => applyAdvancePercentage(60)}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold"
                        title="Standard 60% Advance"
                      >
                        60%
                      </button>
                      <button
                        type="button"
                        onClick={() => applyAdvancePercentage(50)}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-bold"
                      >
                        50%
                      </button>
                    </div>
                  </div>
                  <input
                    type="number"
                    min="0"
                    max={finalTotalAmount}
                    step="0.01"
                    placeholder="0.00"
                    value={amountPaid === 0 ? "" : amountPaid || ""}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (isNaN(val)) {
                        setAmountPaid(0);
                      } else {
                        setAmountPaid(Math.min(finalTotalAmount, Math.max(0, val)));
                      }
                    }}
                    className="w-full bg-white border border-[#E5E7EB] rounded-xl px-3 py-2 text-xs font-mono font-bold text-emerald-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#4B5563] mb-1">
                    Balance Due (₹)
                  </label>
                  <div className="w-full bg-white border border-[#E5E7EB] rounded-xl px-3 py-2 text-xs font-mono font-bold text-amber-600">
                    ₹{balanceRemaining.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 6: Shipping Address & Due Date */}
          <div className="space-y-3 pt-2 border-t border-[#F3F4F6]">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-[#4B5563] mb-1">
                  Target Completion / Due Date
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-3 py-2 text-xs outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#4B5563] mb-1">
                  Factory Priority Level
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-3 py-2 text-xs outline-none font-semibold"
                >
                  <option value="NORMAL">Normal Priority</option>
                  <option value="URGENT">Urgent Priority</option>
                  <option value="RUSH">Rush (Overtime Shift)</option>
                </select>
              </div>
            </div>

            {/* Collapsible Delivery Address */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowAddress(!showAddress)}
                className="text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8] flex items-center gap-1"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>
                  {showAddress ? "Hide Delivery Address" : "Add / Edit Delivery Address"}
                </span>
                <ChevronDown
                  className={`w-3 h-3 transition-transform ${showAddress ? "rotate-180" : ""}`}
                />
              </button>

              {showAddress && (
                <div className="mt-2.5 p-3 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] space-y-2.5">
                  <input
                    type="text"
                    placeholder="Street / Unit / Factory shed address"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    className="w-full bg-white border border-[#E5E7EB] rounded-xl px-3 py-2 text-xs outline-none"
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder="City (e.g. Pune)"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="bg-white border border-[#E5E7EB] rounded-xl px-3 py-2 text-xs outline-none"
                    />
                    <input
                      type="text"
                      placeholder="State (e.g. Maharashtra)"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="bg-white border border-[#E5E7EB] rounded-xl px-3 py-2 text-xs outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Pincode (e.g. 411060)"
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      className="bg-white border border-[#E5E7EB] rounded-xl px-3 py-2 text-xs outline-none font-mono"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Internal Factory Notes */}
            <div>
              <label className="block font-semibold text-[#4B5563] mb-1.5">
                Internal Production Notes & Terms
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Quotation #452. 60% advance received. Customer requested embroidery sampling before bulk production."
                value={internalNote}
                onChange={(e) => setInternalNote(e.target.value)}
                className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-3 text-xs outline-none font-sans min-h-[85px] leading-relaxed resize-y focus:border-[#00A86B] focus:bg-white transition-all shadow-2xs"
              />
            </div>
          </div>
          {/* Close Section 6 */}
          </div>
          {/* Close Scrollable Form Body */}

          {/* Fixed / Sticky Modal Footer: perfectly aligned and separated */}
          <div className="p-4 sm:px-6 bg-white border-t border-[#ECEEF2] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0 rounded-b-2xl shadow-xs z-10">
            <div className="text-xs text-[#6B7280]">
              <span className="font-bold text-[#111827]">{totalQuantity} total pcs</span> across{" "}
              <span className="font-bold text-[#111827]">{items.length} styles</span>
            </div>

            <div className="flex items-center gap-2 justify-end">
              <OpsButton type="button" variant="ghost" size="sm" onClick={onClose}>
                Cancel
              </OpsButton>

              <OpsButton
                type="submit"
                variant="primary"
                size="sm"
                disabled={loading || isParsingQuotation}
                leftIcon={<Check className="w-4 h-4" />}
              >
                {loading ? "Creating Order..." : "Create Production Order"}
              </OpsButton>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
