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
          <h1 className="text-3xl font-bold text-[#435b43]">Order #{order.id}</h1>
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
                <div className="w-full md:w-1/3 flex flex-col gap-3">
                  <h3 className="font-medium text-lg border-b pb-2">Item {index + 1}: {item.product.name}</h3>
                  <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                  
                  {item.design?.imageUrl ? (
                    <div className="relative w-full aspect-square border rounded-lg overflow-hidden bg-gray-50">
                      <Image 
                        src={item.design.imageUrl} 
                        alt="Design Mockup" 
                        fill 
                        style={{ objectFit: "contain" }}
                      />
                    </div>
                  ) : (
                    <div className="w-full aspect-square border border-dashed rounded-lg flex items-center justify-center bg-gray-50 text-gray-400">
                      No mockup available
                    </div>
                  )}
                </div>

                {/* Print Files */}
                <div className="w-full md:w-2/3 flex flex-col gap-4">
                   <h3 className="font-medium text-lg border-b pb-2">Raw Print Files</h3>
                   {item.design?.rawUrl ? (
                     <div className="bg-[#f8f9fa] p-4 rounded-lg border flex flex-col items-start gap-4">
                        <p className="text-sm text-gray-600">
                          This item contains a high-resolution raw asset uploaded by the user. Download this file to send directly to the printing machines.
                        </p>
                        <Link 
                          href={item.design.rawUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-6 py-3 bg-[#435b43] text-white font-medium rounded-lg hover:bg-[#2d3d2d] transition-colors"
                        >
                          <Download size={18} />
                          Download Raw Print Asset
                        </Link>
                     </div>
                   ) : (
                     <p className="text-gray-500 italic mt-4">No raw print assets uploaded for this item.</p>
                   )}

                   {/* Canvas State (Optional for debug) */}
                   {item.design?.stateJson && (
                     <details className="mt-4 text-sm text-gray-600">
                       <summary className="cursor-pointer font-medium hover:text-[#435b43]">View Raw Canvas Coordinates (Advanced)</summary>
                       <pre className="mt-2 p-4 bg-gray-50 rounded border overflow-auto max-h-40">
                         {JSON.stringify(JSON.parse(item.design.stateJson), null, 2)}
                       </pre>
                     </details>
                   )}
                </div>

              </div>
            ))}
          </div>
      </div>
    </div>
  );
}
