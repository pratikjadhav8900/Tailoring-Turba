"use client";

import React, { useState, useEffect } from "react";
import { OpsLayout } from "@/components/ops/layout/OpsLayout";
import { OpsCard } from "@/components/ops/ui/OpsCard";
import { OpsLoadingState } from "@/components/ops/ui/OpsLoadingState";
import type { OpsMaterialConsumptionReference } from "@/types/ops";
import {
  Calculator,
  Search,
  Filter,
  Layers,
  Sparkles,
  Info,
  CheckCircle2,
  FileSpreadsheet,
  ArrowRight,
} from "lucide-react";

export default function OpsMaterialPlanningPage() {
  const [records, setRecords] = useState<OpsMaterialConsumptionReference[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterProduct, setFilterProduct] = useState("ALL");
  const [filterFabric, setFilterFabric] = useState("ALL");
  const [filterSize, setFilterSize] = useState("ALL");
  const [filterOptions, setFilterOptions] = useState<{
    productTypes: string[];
    fabrics: string[];
    sizeBands: string[];
  }>({ productTypes: [], fabrics: [], sizeBands: [] });

  // Interactive Calculator State
  const [calcProduct, setCalcProduct] = useState("Round Neck");
  const [calcFabric, setCalcFabric] = useState("Micro plain polyester");
  const [calcSize, setCalcSize] = useState("18-24");
  const [calcQty, setCalcQty] = useState("1400");
  const [calcResult, setCalcResult] = useState<any>(null);

  const fetchReferenceData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterProduct !== "ALL") params.set("productType", filterProduct);
      if (filterFabric !== "ALL") params.set("fabric", filterFabric);
      if (filterSize !== "ALL") params.set("sizeBand", filterSize);

      const res = await fetch(`/api/ops/rm-reference?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setRecords(data.records || []);
        if (data.filterOptions) setFilterOptions(data.filterOptions);
      }
    } catch (e) {
      console.error("Failed to load RM reference", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReferenceData();
  }, [filterProduct, filterFabric, filterSize]);

  // Execute Calculation
  const handleCalculate = async () => {
    const qty = parseInt(calcQty, 10);
    if (isNaN(qty) || qty <= 0) return;

    try {
      const params = new URLSearchParams({
        productType: calcProduct,
        fabric: calcFabric,
        sizeBand: calcSize,
        quantity: qty.toString(),
      });
      const res = await fetch(`/api/ops/rm-reference?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setCalcResult(data.calculation);
      }
    } catch (e) {
      console.error("Calc error", e);
    }
  };

  useEffect(() => {
    handleCalculate();
  }, [calcProduct, calcFabric, calcSize, calcQty]);

  return (
    <OpsLayout
      pageTitle="Material Planning & Consumption Reference"
      pageSubtitle="SOP worksheet for fabric yield, units/kg ratios, and production procurement estimates"
    >
      <div className="space-y-6 w-full">
        {/* TOP: Interactive Fabric Requirement Calculator */}
        <div className="p-5 bg-white rounded-2xl border border-emerald-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#111827]">
                Fabric Requirement Estimator
              </h3>
              <p className="text-xs text-[#6B7280]">
                Formula: Estimated fabric required (kg) = Garment Quantity ÷ Expected units per kg
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">
                Garment Group
              </label>
              <select
                value={calcProduct}
                onChange={(e) => setCalcProduct(e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-emerald-600"
              >
                <option value="Round Neck">Round Neck</option>
                <option value="Collar">Collar</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">
                Fabric Type
              </label>
              <select
                value={calcFabric}
                onChange={(e) => setCalcFabric(e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-emerald-600"
              >
                <option value="Micro plain polyester">Micro plain polyester</option>
                <option value="Cotton-sinker">Cotton-sinker</option>
                <option value="Dry Fit">Dry Fit</option>
                <option value="Ad Dry Fit">Ad Dry Fit</option>
                <option value="Spun Matty">Spun Matty</option>
                <option value="PCPQ">PCPQ (Unspecified)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">
                Size Band
              </label>
              <select
                value={calcSize}
                onChange={(e) => setCalcSize(e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-emerald-600"
              >
                <option value="18-24">18-24</option>
                <option value="26-32">26-32</option>
                <option value="34-42">34-42</option>
                <option value="44-50">44-50</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">
                Target Garment Pieces
              </label>
              <input
                type="number"
                min="1"
                value={calcQty}
                onChange={(e) => setCalcQty(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono font-bold border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          {/* Calculator Output */}
          {calcResult && (
            <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                  Estimated Raw Fabric Required
                </span>
                {calcResult.error ? (
                  <p className="text-xs text-amber-800 mt-1">{calcResult.error}</p>
                ) : (
                  <>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="text-2xl font-black text-emerald-950">
                        {calcResult.estimatedFabricRequiredKg} kg
                      </span>
                      <span className="text-xs font-semibold text-emerald-800">
                        (@ {calcResult.unitsPerKg} units/kg yield)
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-700 mt-1 font-mono">
                      Calculation: {calcResult.formula}
                    </p>
                    {calcResult.sourceComparison && (
                      <p className="text-[10px] text-emerald-600 mt-0.5">
                        {calcResult.sourceComparison}
                      </p>
                    )}
                  </>
                )}
              </div>
              {calcResult.supplierBrandNote && (
                <div className="px-3 py-1.5 rounded-lg bg-white border border-emerald-200 text-xs font-medium text-emerald-900 shrink-0">
                  <span className="text-[10px] font-bold text-gray-400 block uppercase">Brand Note</span>
                  {calcResult.supplierBrandNote}
                </div>
              )}
            </div>
          )}
        </div>

        {/* BOTTOM: Full Source Reference Table */}
        <div className="bg-white rounded-2xl border border-[#ECEEF2] overflow-hidden shadow-xs space-y-4 p-5">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-[#111827]">
                Manufacturing(RM) Master Table ({records.length} records)
              </h3>
              <p className="text-xs text-[#6B7280]">
                Preserved verbatim from source SOP document with unedited yields and brand notes
              </p>
            </div>

            {/* Quick Filters */}
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={filterProduct}
                onChange={(e) => setFilterProduct(e.target.value)}
                className="px-3 py-1.5 text-xs font-semibold border border-gray-200 rounded-xl bg-white"
              >
                <option value="ALL">All Garments</option>
                {filterOptions.productTypes.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>

              <select
                value={filterFabric}
                onChange={(e) => setFilterFabric(e.target.value)}
                className="px-3 py-1.5 text-xs font-semibold border border-gray-200 rounded-xl bg-white"
              >
                <option value="ALL">All Fabrics</option>
                {filterOptions.fabrics.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>

              <select
                value={filterSize}
                onChange={(e) => setFilterSize(e.target.value)}
                className="px-3 py-1.5 text-xs font-semibold border border-gray-200 rounded-xl bg-white"
              >
                <option value="ALL">All Sizes</option>
                {filterOptions.sizeBands.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <OpsLoadingState message="Loading RM reference data..." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8F9FB] border-b border-[#ECEEF2] text-[#6B7280] font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Garment</th>
                    <th className="py-2.5 px-3">Size Band</th>
                    <th className="py-2.5 px-3">Fabric</th>
                    <th className="py-2.5 px-3">GSM</th>
                    <th className="py-2.5 px-3 text-right">Unit kg</th>
                    <th className="py-2.5 px-3 text-right">Units / kg</th>
                    <th className="py-2.5 px-3 text-right">Source Qty</th>
                    <th className="py-2.5 px-3 text-right">Source Fabric Req (kg)</th>
                    <th className="py-2.5 px-3">Supplier / Brand Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ECEEF2]">
                  {records.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-[#111827]">{r.productType}</td>
                      <td className="py-2.5 px-3 font-mono font-semibold text-emerald-800">{r.sizeBand}</td>
                      <td className="py-2.5 px-3 font-medium text-[#374151]">{r.fabric}</td>
                      <td className="py-2.5 px-3 font-mono text-[#6B7280]">{r.gsm || "—"}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-[#6B7280]">
                        {r.unitKg !== null ? r.unitKg : "—"}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                        {r.unitsPerKg !== null ? r.unitsPerKg : "—"}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-[#111827]">
                        {r.sourceQuantity !== null ? r.sourceQuantity : "—"}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-purple-700">
                        {r.sourceFabricRequiredKg !== null ? r.sourceFabricRequiredKg : "—"}
                      </td>
                      <td className="py-2.5 px-3 text-[#6B7280]">
                        {r.supplierBrandNote ? (
                          <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-medium">
                            {r.supplierBrandNote}
                          </span>
                        ) : r.notes ? (
                          <span className="text-gray-400 italic text-[10px]">{r.notes}</span>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </OpsLayout>
  );
}
