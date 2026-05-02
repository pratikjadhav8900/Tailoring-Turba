import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Download, Package, MapPin, FileImage } from "lucide-react";

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
    },
  });

  if (!order) {
    return notFound();
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#435b43]">Order #{order.orderNumber || order.id}</h1>
          {order.orderNumber && <p className="text-xs text-gray-400 mt-1 font-mono">Ref ID: {order.id}</p>}
          <p className="text-gray-500 mt-2">Placed on {new Date(order.createdAt).toLocaleString()}</p>
        </div>
        <span className="px-4 py-2 bg-[#f4ebd0] text-[#435b43] font-medium rounded-full">
          Status: {order.status}
        </span>
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
            <p><strong>Payment ID:</strong> {order.paymentId || "N/A"}</p>
            <p><strong>Total Items:</strong> {order.items.reduce((acc, item) => acc + item.quantity, 0)} Units</p>
            
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

      {/* Production Assets */}
      <div className="bg-white p-6 rounded-xl border shadow-sm">
         <div className="flex items-center gap-2 mb-6">
            <FileImage className="text-[#435b43]" />
            <h2 className="text-2xl font-semibold">Production Assets</h2>
          </div>

          <div className="space-y-8">
            {order.items.map((item, index) => (
              <div key={item.id} className="border rounded-lg p-6 flex flex-col md:flex-row gap-6">
                
                {/* Mockup Preview */}
                <div className="w-full md:w-1/2 flex flex-col gap-3">
                  <div className="flex items-center justify-between border-b pb-2 mb-2">
                    <h3 className="font-bold text-lg text-[#435b43]">Design Mockup</h3>
                    <span className="text-sm font-medium px-2 py-1 bg-gray-100 rounded text-gray-600">Item {index + 1}</span>
                  </div>
                  
                  {(item.design?.imageUrl || item.mockupUrl || item.mockupUrlBack) ? (
                    <div className={`grid gap-4 ${item.mockupUrl && item.mockupUrlBack ? 'grid-cols-2' : 'grid-cols-1'}`}>
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
                     {(item.design?.rawUrl || (item.printFiles && item.printFiles.length > 0)) ? (
                       <div className="flex flex-col gap-3">
                          {item.design?.rawUrl && (
                            <Link 
                              href={item.design.rawUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-between p-4 bg-[#435b43] text-white rounded-xl hover:bg-[#2d3d2d] transition-all shadow-sm"
                            >
                              <div className="flex items-center gap-3">
                                <Download size={20} />
                                <div className="text-left">
                                  <div className="font-bold text-sm">Download Main Asset</div>
                                  <div className="text-[10px] opacity-70 text-white/80">Original High-Res Source</div>
                                </div>
                              </div>
                            </Link>
                          )}
                          {item.printFiles && item.printFiles.map((url, fi) => {
                            const filename = url.split('/').pop() || `Asset ${fi + 1}`;
                            return (
                              <Link 
                                key={fi} 
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between p-4 bg-white border-2 border-[#435b43] text-[#435b43] rounded-xl hover:bg-[#f0fdf4] transition-all"
                              >
                                <div className="flex items-center gap-3">
                                  <FileImage size={20} />
                                  <div className="text-left">
                                    <div className="font-bold text-sm truncate max-w-[200px]">{filename}</div>
                                    <div className="text-[10px] opacity-70">Customer Uploaded Asset</div>
                                  </div>
                                </div>
                                <Download size={16} />
                              </Link>
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
                   </div>
                </div>

              </div>
            ))}
          </div>
      </div>
    </div>
  );
}
