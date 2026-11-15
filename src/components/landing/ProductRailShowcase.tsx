"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ClothingRailHero } from "@/components/ui/product-rail-gallery";
import type { RailGarment } from "@/components/ui/product-rail-gallery";

/**
 * Mid-range catalogue picks (src/lib/products-data.ts) rendered with real studio
 * cutouts (public/images/rail/*.png — front/side/back cropped from the same turntable
 * render, so they share one canvas and scale and don't resize as the piece turns).
 * Each href matches the real /products/[id] route.
 */
const RAIL_PRODUCTS: RailGarment[] = [
  {
    id: "mauve-polo",
    href: "/products/12",
    name: "Turba Solids Polo",
    kind: "shirt",
    image: "/images/rail/mauve-polo-front.png",
    backImage: "/images/rail/mauve-polo-back.png",
    sideImage: "/images/rail/mauve-polo-side.png",
    tag: "₹300",
    description: "220 GSM polycotton solid polo, piqué knit — built for daily corporate rollouts.",
    details: ["220 GSM PolyCotton", "9 Colors", "S–3XL"],
  },
  {
    id: "lilac-oversized-tee",
    href: "/products/37",
    name: "Biowash Round Neck",
    kind: "tee",
    image: "/images/rail/lilac-oversized-tee-front.png",
    backImage: "/images/rail/lilac-oversized-tee-back.png",
    sideImage: "/images/rail/lilac-oversized-tee-side.png",
    tag: "₹200",
    description: "180 GSM premium cotton, relaxed dropped-shoulder fit.",
    details: ["180 GSM Premium Cotton", "Relaxed fit", "S–2XL"],
  },
  {
    id: "sky-formal-shirt",
    href: "/products/68",
    name: "Shirt-Tee (Formal)",
    kind: "shirt",
    image: "/images/rail/sky-formal-shirt-front.png",
    backImage: "/images/rail/sky-formal-shirt-back.png",
    sideImage: "/images/rail/sky-formal-shirt-side.png",
    tag: "₹615",
    description: "190 GSM shirt collar with tee-level comfort — chest pocket, button cuffs.",
    details: ["190 GSM", "6 Colors", "Shirt collar + tee comfort"],
  },
  {
    id: "olive-track-jacket",
    href: "/products/46",
    name: "Signature Zip Jacket",
    kind: "jacket",
    image: "/images/rail/olive-track-jacket-front.png",
    backImage: "/images/rail/olive-track-jacket-back.png",
    sideImage: "/images/rail/olive-track-jacket-side.png",
    tag: "₹510",
    description: "300 GSM fleece track jacket, stand collar, raglan sleeve, zip side pockets.",
    details: ["300 GSM Fleece", "Full Zip", "S–3XL"],
  },
  {
    id: "black-crew-tee",
    href: "/products/57",
    name: "Premium Crewneck",
    kind: "tee",
    image: "/images/rail/black-crew-tee-front.png",
    backImage: "/images/rail/black-crew-tee-back.png",
    sideImage: "/images/rail/black-crew-tee-side.png",
    tag: "₹250",
    description: "185 GSM PIMA cotton crewneck — our cleanest daily tee.",
    details: ["185 GSM PIMA Cotton", "10 Colors", "S–3XL"],
  },
  {
    id: "neon-track-jacket",
    href: "/products/66",
    name: "2-in-1 Zipper Hoodie",
    kind: "jacket",
    image: "/images/rail/neon-track-jacket-front.png",
    backImage: "/images/rail/neon-track-jacket-back.png",
    sideImage: "/images/rail/neon-track-jacket-side.png",
    tag: "₹580",
    description: "300 GSM zip-through with contrast ribbed cuffs and hem.",
    details: ["300 GSM", "Zipper front", "4 Colors"],
  },
  {
    id: "navy-zip-hoodie",
    href: "/products/17",
    name: "Turba Hood + Kangaroo Hoodie",
    kind: "hoodie",
    image: "/images/rail/navy-zip-hoodie-front.png",
    backImage: "/images/rail/navy-zip-hoodie-back.png",
    sideImage: "/images/rail/navy-zip-hoodie-side.png",
    tag: "₹460",
    description: "310 GSM polycotton hoodie with a kangaroo pocket — our winter staple.",
    details: ["310 GSM PolyCotton", "Kangaroo or Zip", "MOQ 10 pcs"],
  },
  {
    id: "black-pullover-hoodie",
    href: "/products/65",
    name: "Classic Hoodie",
    kind: "hoodie",
    image: "/images/rail/black-pullover-hoodie-front.png",
    backImage: "/images/rail/black-pullover-hoodie-back.png",
    sideImage: "/images/rail/black-pullover-hoodie-side.png",
    tag: "₹525",
    description: "300 GSM pullover hoodie, ribbed cuffs and hem, kangaroo pocket.",
    details: ["300 GSM", "4 Colors", "S–3XL"],
  },
  {
    id: "red-polo",
    href: "/products/60",
    name: "Mars200 Polo",
    kind: "shirt",
    image: "/images/rail/red-polo-front.png",
    backImage: "/images/rail/red-polo-back.png",
    sideImage: "/images/rail/red-polo-side.png",
    tag: "₹300",
    description: "200 GSM polyester polo with a contrast inner collar.",
    details: ["200 GSM Polyester", "16 Colors", "S–3XL"],
  },
];

export default function ProductRailShowcase() {
  return (
    <ClothingRailHero
      items={RAIL_PRODUCTS}
      hanger="wood"
      autoplay
      eyebrow="Pune's Premier B2B Manufacturer"
      heading="Built for innovators like you. We create customized apparel on which you express your individuality."
      caption="Brush along the rail or tap a piece — polos, dryfit tees, shirts, jackets and hoodies, turned to show every angle."
      action={
        <Link
          href="/products"
          className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background shadow-sm outline-none transition-[transform,box-shadow] hover:-translate-y-px hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          Explore Our Range <ArrowRight size={16} />
        </Link>
      }
    />
  );
}
