import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  CoverflowCarousel,
  type CoverflowSlide,
} from "@/components/ui/coverflow-carousel";

/**
 * Studio photography of the range, shown as a draggable 3D coverflow.
 * Every image is a real product shot already in /public/images/categories (≈1200px,
 * served through next/image so each card downloads a right-sized WebP).
 * Each slide's call-to-action uses a filter that /products really understands
 * (?gender=Men|Women|Kids — see ProductsClient) so it never lands on an empty list.
 */
const BRANDING = { label: "Branding", value: "Print · Embroidery" };
const ORDERS = { label: "Orders", value: "Custom & bulk" };

const SLIDES: CoverflowSlide[] = [
  {
    src: "/images/categories/men_polo.png",
    alt: "Man wearing a navy piqué polo shirt with a two-button placket",
    title: "Polos",
    subtitle: "For men · corporate & team wear",
    meta: [BRANDING, ORDERS],
    href: "/products?gender=Men",
    cta: "Shop men's range",
  },
  {
    src: "/images/categories/men_crewneck_tee.png",
    alt: "Man wearing a plain crewneck cotton t-shirt",
    title: "Crewneck Tees",
    subtitle: "For men · everyday essentials",
    meta: [BRANDING, ORDERS],
    href: "/products?gender=Men",
    cta: "Shop men's range",
  },
  {
    src: "/images/categories/men_hoodie.png",
    alt: "Man wearing a fleece pullover hoodie",
    title: "Hoodies",
    subtitle: "For men · winter wear",
    meta: [BRANDING, ORDERS],
    href: "/products?gender=Men",
    cta: "Shop men's range",
  },
  {
    src: "/images/categories/men_jacket.png",
    alt: "Man wearing a zip-front jacket",
    title: "Jackets",
    subtitle: "For men · winter wear",
    meta: [BRANDING, ORDERS],
    href: "/products?gender=Men",
    cta: "Shop men's range",
  },
  {
    src: "/images/categories/women_tshirt.png",
    alt: "Woman wearing a fitted cotton t-shirt",
    title: "T-Shirts",
    subtitle: "For women · everyday essentials",
    meta: [BRANDING, ORDERS],
    href: "/products?gender=Women",
    cta: "Shop women's range",
  },
  {
    src: "/images/categories/women_oversized.png",
    alt: "Woman wearing a royal-blue oversized drop-shoulder t-shirt",
    title: "Oversized Tees",
    subtitle: "For women · relaxed fit",
    meta: [BRANDING, ORDERS],
    href: "/products?gender=Women",
    cta: "Shop women's range",
  },
  {
    src: "/images/categories/women_hoodie.png",
    alt: "Woman wearing a pullover hoodie",
    title: "Hoodies",
    subtitle: "For women · winter wear",
    meta: [BRANDING, ORDERS],
    href: "/products?gender=Women",
    cta: "Shop women's range",
  },
  {
    src: "/images/categories/kids_tshirt.jpg",
    alt: "Child wearing a colourful cotton t-shirt",
    title: "Kids' T-Shirts",
    subtitle: "For kids · school & events",
    meta: [BRANDING, ORDERS],
    href: "/products?gender=Kids",
    cta: "Shop kids' range",
  },
  {
    src: "/images/categories/kids_uniform.jpg",
    alt: "Child wearing a school uniform shirt",
    title: "School Uniforms",
    subtitle: "For kids · schools & institutions",
    meta: [BRANDING, ORDERS],
    href: "/products?gender=Kids",
    cta: "Shop kids' range",
  },
];

export default function ProductCoverflow() {
  return (
    <section
      aria-labelledby="product-coverflow-heading"
      className="overflow-hidden bg-warm-bone py-16 md:py-24"
    >
      <div className="container mx-auto px-6 text-center">
        <p className="text-xs font-medium uppercase tracking-[0.22em] text-sage">
          The Collection
        </p>
        <h2
          id="product-coverflow-heading"
          className="mx-auto mt-3 max-w-2xl font-display text-3xl font-extrabold leading-tight tracking-tight text-ink md:text-5xl"
        >
          Made to order. Made to wear your name.
        </h2>
      </div>

      <CoverflowCarousel
        slides={SLIDES}
        label="Tailoring Turba product range"
        showCaption
        showPagination
        showNavigation
        imageClassName="object-[center_30%]"
        className="mt-4"
        cardWidth="clamp(260px, 42vw, 560px)"
        imageSizes="(max-width: 1200px) 42vw, 560px"
        autoPlay
        autoPlayInterval={3200}
      />

      <div className="mt-10 flex justify-center px-6">
        <Link
          href="/products"
          className="inline-flex items-center gap-2 rounded-full border border-ink/20 px-6 py-3 text-sm font-medium text-ink outline-none transition-colors hover:bg-ink hover:text-warm-bone focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-warm-bone"
        >
          View the full catalogue <ArrowRight size={16} />
        </Link>
      </div>
    </section>
  );
}
