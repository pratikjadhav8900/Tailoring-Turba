export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Download, Package, MapPin, FileImage, CreditCard, ShieldAlert, History, Truck, CheckCircle2, Lock, Unlock } from "lucide-react";
import { CustomizerState, DesignElement } from "@/types/customizer";
import { getElementDetails } from "@/lib/customizer-utils";
import DownloadButton from "./DownloadButton";
import ResendInvoiceButton from "./ResendInvoiceButton";
import { calculateLedgerFromTransactions, rupeesToPaise, paiseToRupees, formatPaiseToINR } from "@/lib/currency";

export default async function OrderDetailsPage({ params }: { params: { id: string } }) {
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      user: true,
      shippingAddress: true,
      orderSheet: true,
      items: {
        include: {
          product: true,
          design: true,
        },
      },
      feedback: true,
      paymentTransactions: {
        orderBy: { createdAt: "desc" },
      },
      shipments: {
        orderBy: { createdAt: "desc" },
      },
      timelineEvents: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!order) {
    return notFound();
  }

  // Calculate authoritative ledger
  let ledger;
  if (order.paymentTransactions && order.paymentTransactions.length > 0) {
    ledger = calculateLedgerFromTransactions(rupeesToPaise(order.totalAmount), order.paymentTransactions as any);
  } else {
    const grossPaidPaise = rupeesToPaise(order.amountPaid || 0);
    const totalPaise = rupeesToPaise(order.totalAmount);
    const balancePaise = Math.max(0, totalPaise - grossPaidPaise);
    ledger = {
      orderTotalPaise: totalPaise,
      grossPaidPaise,
      totalRefundedPaise: rupeesToPaise(order.refundedAmount || 0),
      netPaidPaise: grossPaidPaise,
      balanceDuePaise: balancePaise,
      isPaidInFull: balancePaise === 0,
    };
  }

  const balanceDueRupees = Math.round(paiseToRupees(ledger.balanceDuePaise));
  const netPaidRupees = Math.round(paiseToRupees(ledger.netPaidPaise));
  const isDispatchLocked = ledger.balanceDuePaise > 0 && order.status !== "CANCELLED" && order.status !== "DELIVERED";

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#435b43]">Order #{order.orderNumber || order.id}</h1>
          {order.orderNumber && <p className="text-xs text-gray-400 mt-1 font-mono">Ref ID: {order.id}</p>}
          <p className="text-gray-500 mt-2">Placed on {new Date(order.createdAt).toLocaleString()}</p>
        </div>
        <div className="flex items-center gap-3">
          {isDispatchLocked ? (
            <span className="px-3 py-1.5 bg-amber-100 text-amber-800 text-xs font-bold rounded-full flex items-center gap-1.5 border border-amber-300">
              <Lock size={13} /> Dispatch Locked (Bal: ₹{balanceDueRupees.toLocaleString('en-IN')})
            </span>
          ) : (
            <span className="px-3 py-1.5 bg-green-100 text-green-800 text-xs font-bold rounded-full flex items-center gap-1.5 border border-green-300">
              <Unlock size={13} /> Dispatch Unlocked
            </span>
          )}
          <span className="px-4 py-2 bg-[#f4ebd0] text-[#435b43] font-bold rounded-full text-sm">
            Status: {order.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Customer & Shipping Info */}
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="text-[#435b43]" />
            <h2 className="text-xl font-semibold">Shipping Details</h2>
          </div>
          
          <div className="space-y-3 text-gray-700">
            <p><strong>Customer:</strong> {order.user.name} ({order.user.email})</p>
            {order.shippingAddress ? (
              <>
                <p><strong>Name on package:</strong> {order.shippingAddress.name}</p>
                <p><strong>Address:</strong></p>
                <address className="not-italic pl-4 border-l-2 border-[#435b43] text-gray-600">
                  {order.shippingAddress.street}<br/>
                  {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}<br/>
                  {order.shippingAddress.country}
                </address>
              </>
            ) : (
              <p className="text-red-500 italic">No shipping address recorded for this order.</p>
            )}
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Package className="text-[#435b43]" />
            <h2 className="text-xl font-semibold">Order Summary</h2>
          </div>
          <div className="space-y-3 text-gray-700">
            <p><strong>Total Amount:</strong> ₹{order.totalAmount.toLocaleString()}</p>
            <p><strong>Total Items:</strong> {order.items.reduce((acc, item) => acc + item.quantity, 0)} Units</p>
            <p><strong>Split Payment Mode:</strong> {order.isSplitPayment ? "Yes (Advance + Balance)" : "Standard"}</p>
            
            {order.orderSheet && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold mb-2">Order Sheet Notes:</h3>
                <pre className="text-xs overflow-auto">
                  {JSON.stringify(order.orderSheet.sheetData, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Financial Ledger & Transactions Section */}
      <div className="bg-white p-6 rounded-xl border shadow-sm">
        <div className="flex items-center justify-between mb-4 pb-2 border-b">
          <div className="flex items-center gap-2">
            <CreditCard className="text-[#435b43]" />
            <h2 className="text-xl font-semibold">Financial Ledger (Exact Integer Accounting)</h2>
          </div>
          <span className="text-xs font-mono text-gray-500">Currency: INR (Paise Accurate)</span>
        </div>

        {/* Financial Metrics Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 bg-gray-50 rounded-lg border">
            <span className="text-xs text-gray-500 font-bold uppercase">Order Total</span>
            <div className="text-xl font-bold font-mono text-gray-900 mt-1">₹{order.totalAmount.toLocaleString('en-IN')}</div>
            <span className="text-[10px] text-gray-400 font-mono">{ledger.orderTotalPaise.toLocaleString()} paise</span>
          </div>
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <span className="text-xs text-green-700 font-bold uppercase">Gross Collected</span>
            <div className="text-xl font-bold font-mono text-green-800 mt-1">₹{Math.round(paiseToRupees(ledger.grossPaidPaise)).toLocaleString('en-IN')}</div>
            <span className="text-[10px] text-green-600 font-mono">{ledger.grossPaidPaise.toLocaleString()} paise</span>
          </div>
          <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
            <span className="text-xs text-amber-700 font-bold uppercase">Balance Due</span>
            <div className="text-xl font-bold font-mono text-amber-800 mt-1">₹{balanceDueRupees.toLocaleString('en-IN')}</div>
            <span className="text-[10px] text-amber-600 font-mono">{ledger.balanceDuePaise.toLocaleString()} paise</span>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <span className="text-xs text-blue-700 font-bold uppercase">Payment Status</span>
            <div className="text-base font-bold text-blue-900 mt-1">
              {ledger.isPaidInFull ? "Paid in Full ✓" : "Advance Received"}
            </div>
            <span className="text-xs text-blue-700 font-medium">{ledger.isPaidInFull ? "Ready for unrestricted dispatch" : "Gating active"}</span>
          </div>
        </div>

        {/* Transactions Table */}
        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-700 mb-2">Ledger Entries ({order.paymentTransactions?.length || 0})</h3>
        {order.paymentTransactions && order.paymentTransactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600 font-semibold border-b">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Provider</th>
                  <th className="py-2.5 px-3">Provider Payment ID</th>
                </tr>
              </thead>
              <tbody className="divide-y text-gray-700">
                {order.paymentTransactions.map((tx: any) => (
                  <tr key={tx.id} className="hover:bg-gray-50/50">
                    <td className="py-2 px-3 text-xs">{new Date(tx.createdAt).toLocaleString()}</td>
                    <td className="py-2 px-3 font-semibold text-xs">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-mono ${
                        tx.type === 'REFUND' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        tx.status === 'CAPTURED' ? 'bg-green-100 text-green-800' :
                        tx.status === 'FAILED' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="py-2 px-3 font-mono font-bold">₹{Math.round(paiseToRupees(tx.amountPaise)).toLocaleString('en-IN')}</td>
                    <td className="py-2 px-3 text-xs text-gray-500">{tx.provider}</td>
                    <td className="py-2 px-3 text-xs font-mono text-gray-600">{tx.providerPaymentId || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-4 bg-gray-50 rounded text-center text-xs text-gray-500">
            No dedicated transaction ledger records found. (Historical order: initial paid ₹{(order.amountPaid || 0).toLocaleString('en-IN')})
          </div>
        )}
      </div>

      {/* Logistics & Shipments Section */}
      <div className="bg-white p-6 rounded-xl border shadow-sm">
        <div className="flex items-center gap-2 mb-4 pb-2 border-b">
          <Truck className="text-[#435b43]" />
          <h2 className="text-xl font-semibold">Logistics & Shipments</h2>
        </div>

        {order.shipments && order.shipments.length > 0 ? (
          <div className="space-y-4">
            {order.shipments.map((s: any) => (
              <div key={s.id} className="p-4 border rounded-lg bg-gray-50/50 flex flex-wrap justify-between items-center gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900">{s.courierName || "Courier Partner"}</span>
                    <span className="px-2 py-0.5 text-xs font-bold rounded bg-indigo-100 text-indigo-800">{s.status}</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1 font-mono">AWB: {s.awbNumber || "Pending generation"} | Ref: {s.providerOrderId || "N/A"}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">Created: {new Date(s.createdAt).toLocaleString()}</p>
                </div>
                {s.awbNumber && (
                  <a
                    href={s.awbNumber.startsWith("http") ? s.awbNumber : `https://app.bigship.in/track_order`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 bg-[#435b43] text-white text-xs font-bold rounded hover:bg-[#344734] transition-colors"
                  >
                    Track Shipment ↗
                  </a>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 bg-gray-50 rounded text-center text-xs text-gray-500">
            {order.bigshipTrackingId ? (
              <p>Legacy tracking recorded: <strong>{order.bigshipCourierName || "Courier"}</strong> (AWB: {order.bigshipTrackingId})</p>
            ) : (
              <p>No shipments generated yet. Use the Admin Orders dashboard to book BigShip or local dispatch.</p>
            )}
          </div>
        )}
      </div>

      {/* Audit Timeline Events Section */}
      <div className="bg-white p-6 rounded-xl border shadow-sm">
        <div className="flex items-center gap-2 mb-4 pb-2 border-b">
          <History className="text-[#435b43]" />
          <h2 className="text-xl font-semibold">Audit Trail & Timeline Events</h2>
        </div>

        {order.timelineEvents && order.timelineEvents.length > 0 ? (
          <div className="relative pl-6 border-l-2 border-gray-200 space-y-4">
            {order.timelineEvents.map((event: any) => (
              <div key={event.id} className="relative">
                <div className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-[#435b43] border-2 border-white" />
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-bold text-gray-900">{event.title}</span>
                  <span className="text-[10px] text-gray-400">{new Date(event.createdAt).toLocaleString()}</span>
                  {event.status && <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">{event.status}</span>}
                  {event.actorType && (
                    <span className="text-[10px] px-1 rounded bg-slate-100 text-slate-600 font-mono">
                      by {event.actorType}
                    </span>
                  )}
                </div>
                {event.description && <p className="text-xs text-gray-600 mt-1">{event.description}</p>}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 bg-gray-50 rounded text-center text-xs text-gray-500">
            No audit timeline events recorded yet.
          </div>
        )}
      </div>
            {order.feedback && (
        <div className="bg-white p-6 rounded-xl border shadow-sm border-l-4 border-l-[#435b43]">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b">
            <h2 className="text-xl font-semibold text-[#435b43]">Customer Review & Feedback</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Service Section */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#435b43] border-b pb-1">Service (out of 5)</h3>
              <div className="flex justify-between text-sm text-gray-700">
                <span>Overall Experience:</span>
                <span className="font-bold">{order.feedback.serviceOverall}/5</span>
              </div>
              <div className="flex justify-between text-sm text-gray-700">
                <span>Team Helpfulness:</span>
                <span className="font-bold">{order.feedback.serviceProfessionalism}/5</span>
              </div>
              <div className="flex justify-between text-sm text-gray-700">
                <span>On-time Delivery:</span>
                <span className="font-bold">{order.feedback.serviceTimeline}/5</span>
              </div>
            </div>

            {/* Ease of Service */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#435b43] border-b pb-1">Ease of Service (out of 5)</h3>
              <div className="flex justify-between text-sm text-gray-700">
                <span>Placing Order:</span>
                <span className="font-bold">{order.feedback.easeOrdering}/5</span>
              </div>
              <div className="flex justify-between text-sm text-gray-700">
                <span>Updates & Communication:</span>
                <span className="font-bold">{order.feedback.easeCommunication}/5</span>
              </div>
              <div className="flex justify-between text-sm text-gray-700">
                <span>Approval Process:</span>
                <span className="font-bold">{order.feedback.easeProcess}/5</span>
              </div>
            </div>

            {/* Fabric Quality */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#435b43] border-b pb-1">Fabric Quality (out of 5)</h3>
              <div className="flex justify-between text-sm text-gray-700">
                <span>Fabric Quality:</span>
                <span className="font-bold">{order.feedback.fabricQuality}/5</span>
              </div>
              <div className="flex justify-between text-sm text-gray-700">
                <span>Comfort & Finish:</span>
                <span className="font-bold">{order.feedback.fabricExpectations}/5</span>
              </div>
              <div className="flex justify-between text-sm text-gray-700">
                <span>Stitching & Garment:</span>
                <span className="font-bold">{order.feedback.fabricStitching}/5</span>
              </div>
            </div>

            {/* Printing & Branding */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#435b43] border-b pb-1">Printing & Branding (out of 5)</h3>
              <div className="flex justify-between text-sm text-gray-700">
                <span>Branding Quality:</span>
                <span className="font-bold">{order.feedback.printingLogo}/5</span>
              </div>
              <div className="flex justify-between text-sm text-gray-700">
                <span>Color & Design Placement:</span>
                <span className="font-bold">{order.feedback.printingAccuracy}/5</span>
              </div>
            </div>
          </div>

          {order.feedback.comment && (
            <div className="p-4 bg-[#fcfbf9] border border-gray-100 rounded-lg">
              <p className="text-xs uppercase tracking-wider text-gray-400 font-bold mb-2">Q12. What could we improve to make your next experience even better?</p>
              <p className="text-gray-700 italic font-medium">"{order.feedback.comment}"</p>
            </div>
          )}
        </div>
      )}

      {/* Resend Invoice */}
      <ResendInvoiceButton orderId={order.id} />

      {/* Production Assets */}
      <div className="bg-white p-6 rounded-xl border shadow-sm">
         <div className="flex items-center gap-2 mb-6">
            <FileImage className="text-[#435b43]" />
            <h2 className="text-2xl font-semibold">Production Assets</h2>
          </div>

          <div className="space-y-8">
            {order.items.map((item, index) => {
              // Parse custom state to extract any logo URLs (e.g. from existing asset library)
              let customState: CustomizerState | null = null;
              let stateLogoUrls: string[] = [];
              try {
                if (item.customStateJson) {
                  customState = JSON.parse(item.customStateJson) as CustomizerState;
                  stateLogoUrls = [
                    ...(customState.frontElements || []).filter((el) => el.type === "logo" && el.value).map((el) => el.value),
                    ...(customState.backElements || []).filter((el) => el.type === "logo" && el.value).map((el) => el.value),
                    ...(customState.leftElements || []).filter((el) => el.type === "logo" && el.value).map((el) => el.value),
                    ...(customState.rightElements || []).filter((el) => el.type === "logo" && el.value).map((el) => el.value),
                  ];
                }
              } catch (e) {
                console.error("Failed to parse customState for logos", e);
              }

              // Combine explicitly uploaded printFiles with logo URLs from the canvas state
              const allPrintFiles = [...(item.printFiles || []), ...stateLogoUrls];
              const uniquePrintFiles = Array.from(new Set(allPrintFiles));

              return (
              <div key={item.id} className="border rounded-lg p-6 flex flex-col md:flex-row gap-6">
                
                {/* Mockup Preview */}
                <div className="w-full md:w-1/2 flex flex-col gap-3">
                  <div className="flex items-center justify-between border-b pb-2 mb-2">
                    <h3 className="font-bold text-lg text-[#435b43]">Design Mockup</h3>
                    <span className="text-sm font-medium px-2 py-1 bg-gray-100 rounded text-gray-600">Item {index + 1}</span>
                  </div>
                  
                  {(item.design?.imageUrl || item.mockupUrl || item.mockupUrlBack || item.mockupUrlLeft || item.mockupUrlRight) ? (
                    <div className="grid gap-4 grid-cols-2">
                      {/* Front Side */}
                      {(item.design?.imageUrl || item.mockupUrl) && (
                        <div className="flex flex-col gap-2">
                          <div className="relative w-full aspect-[4/5] border rounded-xl overflow-hidden bg-white shadow-inner group">
                            <Image 
                              src={item.design?.imageUrl || item.mockupUrl || ""} 
                              alt="Front Mockup" 
                              fill 
                              style={{ objectFit: "contain", padding: "20px" }}
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors pointer-events-none" />
                          </div>
                          <p className="text-[10px] text-center font-bold text-gray-400 uppercase tracking-widest">Front View</p>
                        </div>
                      )}

                      {/* Back Side */}
                      {item.mockupUrlBack && (
                        <div className="flex flex-col gap-2">
                          <div className="relative w-full aspect-[4/5] border rounded-xl overflow-hidden bg-white shadow-inner group">
                            <Image 
                              src={item.mockupUrlBack} 
                              alt="Back Mockup" 
                              fill 
                              style={{ objectFit: "contain", padding: "20px" }}
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors pointer-events-none" />
                          </div>
                          <p className="text-[10px] text-center font-bold text-gray-400 uppercase tracking-widest">Back View</p>
                        </div>
                      )}
                      
                      {/* Left Side */}
                      {item.mockupUrlLeft && (
                        <div className="flex flex-col gap-2">
                          <div className="relative w-full aspect-[4/5] border rounded-xl overflow-hidden bg-white shadow-inner group">
                            <Image 
                              src={item.mockupUrlLeft} 
                              alt="Sleeves Mockup" 
                              fill 
                              style={{ objectFit: "contain", padding: "20px" }}
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors pointer-events-none" />
                          </div>
                          <p className="text-[10px] text-center font-bold text-gray-400 uppercase tracking-widest">Sleeves</p>
                        </div>
                      )}
                      
                      {/* Right Side */}
                      {item.mockupUrlRight && (
                        <div className="flex flex-col gap-2">
                          <div className="relative w-full aspect-[4/5] border rounded-xl overflow-hidden bg-white shadow-inner group">
                            <Image 
                              src={item.mockupUrlRight} 
                              alt="Right Mockup" 
                              fill 
                              style={{ objectFit: "contain", padding: "20px" }}
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors pointer-events-none" />
                          </div>
                          <p className="text-[10px] text-center font-bold text-gray-400 uppercase tracking-widest">Right Sleeve</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-full aspect-[4/5] border border-dashed rounded-xl flex flex-col items-center justify-center bg-gray-50 text-gray-400 gap-2">
                      <FileImage size={40} className="opacity-20" />
                      <p className="text-sm font-medium">No mockup image captured</p>
                    </div>
                  )}
                </div>

                {/* Production Files & Specs */}
                <div className="w-full md:w-1/2 flex flex-col gap-6">
                   <div>
                     <h3 className="font-bold text-lg text-[#435b43] border-b pb-2 mb-4">Production Assets</h3>
                     {(item.design?.rawUrl || uniquePrintFiles.length > 0) ? (
                       <div className="flex flex-col gap-3">
                          {item.design?.rawUrl && (
                            <DownloadButton 
                               url={item.design.rawUrl}
                               filename={item.design.rawUrl.split('/').pop() || "main_asset.png"}
                               className="flex items-center justify-between p-4 bg-[#435b43] text-white rounded-xl hover:bg-[#2d3d2d] transition-all shadow-sm w-full"
                             >
                               <div className="flex items-center gap-3">
                                 <div className="text-left">
                                   <div className="font-bold text-sm">Download Main Asset</div>
                                   <div className="text-[10px] opacity-70 text-white/80">Original High-Res Source</div>
                                 </div>
                               </div>
                             </DownloadButton>
                          )}
                          {uniquePrintFiles.map((url, fi) => {
                            const filename = url.split('/').pop() || `Asset ${fi + 1}`;
                            return (
                              <DownloadButton 
                                 key={fi} 
                                 url={url}
                                 filename={filename}
                                 className="flex items-center justify-between p-4 bg-white border-2 border-[#435b43] text-[#435b43] rounded-xl hover:bg-[#f0fdf4] transition-all w-full"
                               >
                                 <div className="flex items-center gap-3">
                                   <FileImage size={20} />
                                   <div className="text-left">
                                     <div className="font-bold text-sm truncate max-w-[200px]">{filename}</div>
                                     <div className="text-[10px] opacity-70">Design Logo / Asset</div>
                                   </div>
                                 </div>
                               </DownloadButton>
                            );
                          })}
                       </div>
                     ) : (
                       <div className="p-8 border border-dashed rounded-xl text-center text-gray-400">
                          <p className="text-sm italic">No custom assets provided for this item.</p>
                       </div>
                     )}
                   </div>

                    <div className="pt-4 border-t border-gray-100">
                       <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Item Details</h4>
                       <div className="grid grid-cols-2 gap-4 text-sm">
                         <div className="bg-gray-50 p-3 rounded-lg">
                           <span className="block text-gray-500 text-[10px] uppercase font-bold">Product</span>
                           <span className="font-semibold text-gray-800">{item.product.name}</span>
                         </div>
                         <div className="bg-gray-50 p-3 rounded-lg">
                           <span className="block text-gray-500 text-[10px] uppercase font-bold">Total Qty</span>
                           <span className="font-semibold text-gray-800">{item.quantity} Units</span>
                         </div>
                       </div>

                       {/* Parse Custom State */}
                       {(() => {
                         if (!customState) return null;
                         try {
                           const garmentType = customState.garmentType || "round-neck";
                           
                           const renderElements = (elements: DesignElement[], side: string) => {
                             if (!elements || elements.length === 0) return null;
                             return (
                               <div className="mt-4 space-y-3">
                                 <h5 className="font-bold text-[11px] text-gray-400 uppercase tracking-wider border-b pb-1">
                                   {side} Customizations
                                 </h5>
                                 <div className="space-y-3">
                                   {elements.map((el, idx) => {
                                     const details = getElementDetails(el, garmentType, side.toLowerCase());
                                     return (
                                       <div key={el.id || idx} className="p-3 bg-gray-50 rounded-lg border border-gray-100 flex flex-col gap-2">
                                         <div className="flex items-center justify-between">
                                           <span className="font-semibold text-sm text-[#435b43]">
                                             {el.type === "text" ? `Text Layer: "${el.value}"` : `Logo Layer (${el.value ? 'Uploaded File' : 'Generic'})`}
                                           </span>
                                           <span className="px-2 py-0.5 text-[9px] font-bold bg-[#f4ebd0] text-[#435b43] rounded uppercase">
                                             {details.printType}
                                           </span>
                                         </div>
                                         
                                         <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                                           <div>
                                             <span className="text-[9px] text-gray-400 block uppercase font-bold">Dimensions</span>
                                             <span className="font-medium text-gray-800">{details.widthInches}" W x {details.heightInches}" H</span>
                                           </div>
                                           <div>
                                             <span className="text-[9px] text-gray-400 block uppercase font-bold">Color Option</span>
                                             <span className="font-medium text-gray-800">
                                               {details.printType === "embroidery"
                                                 ? (details.embroideryType === "mono" ? "Mono Color" : "Multi Color")
                                                 : (details.embroideryType === "mono" ? "Mono Color" : "Colorful")}
                                             </span>
                                           </div>
                                           {el.type === "text" && (
                                             <div className="col-span-2">
                                               <span className="text-[9px] text-gray-400 block uppercase font-bold">Font / Color</span>
                                               <span className="font-medium text-gray-800">
                                                 {el.fontFamily || "Default"} / <span className="inline-block w-2.5 h-2.5 rounded-full border align-middle ml-1" style={{ backgroundColor: el.color }} /> {el.color}
                                               </span>
                                             </div>
                                           )}
                                           {details.dpi && (
                                             <div className="col-span-2">
                                               <span className="text-[9px] text-gray-400 block uppercase font-bold">Render Quality</span>
                                               <span className={`font-semibold ${details.dpiQuality === 'Good' ? 'text-emerald-600' : details.dpiQuality === 'Fair' ? 'text-amber-600' : 'text-rose-600'}`}>
                                                 {details.dpi} DPI ({details.dpiQuality})
                                               </span>
                                             </div>
                                           )}
                                         </div>
                                       </div>
                                     );
                                   })}
                                 </div>
                               </div>
                             );
                           };

                           return (
                             <div className="mt-4 pt-4 border-t border-dashed border-gray-200">
                               <h4 className="text-sm font-bold text-gray-700 mb-2 font-semibold">Design Placement & Specs:</h4>
                               {renderElements(customState.frontElements, "Front")}
                               {renderElements(customState.backElements, "Back")}
                               {renderElements(customState.leftElements, "Sleeves")}
                               {renderElements(customState.rightElements, "Right")}
                             </div>
                           );
                         } catch (err) {
                           console.error("Failed to parse customStateJson", err);
                           return null;
                         }
                       })()}
                    </div>
                </div>

              </div>
              );
            })}
          </div>
      </div>
    </div>
  );
}
