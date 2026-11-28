import { Layers } from "lucide-react";

import Endless from "@/components/ui/endless";
import type { EndlessItem } from "@/components/ui/endless";

/**
 * Pure product/material photography — no people in any shot (see commit history:
 * an earlier pass with a person wearing a VR headset was rejected). Drop new
 * photos in /public/images/showcase using these exact filenames to replace them.
 */
const SHOWCASE_ITEMS: EndlessItem[] = [
  {
    src: "/images/showcase/custom-bag-assortment.jpg",
    alt: "A styled flat-lay of custom tote bags, drawstring bags, and zippered pouches in an assortment of colors and prints.",
  },
  {
    src: "/images/showcase/duffel-bag-hardware-macro.jpg",
    alt: "Macro detail of a custom duffel bag's zipper pull and webbing strap against heavy canvas fabric.",
  },
  {
    src: "/images/showcase/embroidered-logo-macro.jpg",
    alt: "Macro close-up of a raised embroidered brand logo on heavy cotton twill, individual thread stitches catching the light.",
  },
  {
    src: "/images/showcase/embroidery-needle-in-motion.jpg",
    alt: "Macro shot of an industrial embroidery machine needle mid-stitch, thread looping through fabric stretched in a hoop.",
  },
  {
    src: "/images/showcase/dtf-film-peel-detail.jpg",
    alt: "Extreme close-up of a DTF transfer film lifting off a freshly pressed t-shirt on a heat-press platen, revealing the glossy design beneath.",
  },
  {
    src: "/images/showcase/screen-print-ink-sheen.jpg",
    alt: "Close-up of thick screen-printed ink laid on dark cotton fabric, showing the raised texture and glossy sheen of the ink layer.",
  },
  {
    src: "/images/showcase/sublimation-color-bleed.jpg",
    alt: "Macro shot of an all-over sublimation print where dye colors bleed softly into polyester fibers in a gradient pattern.",
  },
  {
    src: "/images/showcase/tailored-blazer-on-form.jpg",
    alt: "A tailored blazer displayed on a dress form, highlighting the structured lapel and shoulder stitching.",
  },
  {
    src: "/images/showcase/denim-dungarees-hanging-pair.jpg",
    alt: "A pair of denim dungarees with metal buckle straps hanging on a steel clothing rack.",
  },
  {
    src: "/images/showcase/woven-label-hangtag-macro.jpg",
    alt: "A macro shot of a woven private-label neck label stitched into a garment collar beside a blank kraft hang tag.",
  },
  {
    src: "/images/showcase/finished-stock-rolling-racks.jpg",
    alt: "Long rolling racks of finished garments on hangers stretching back into a factory floor under industrial lighting.",
  },
];

export default function FeaturesGrid() {
  return (
    <section className="relative h-[70vh] min-h-[480px] max-h-[760px] w-full">
      <Endless
        items={SHOWCASE_ITEMS}
        title={"One Factory,\nEvery Finish"}
        caption="Embroidery, DTF, screen print, sublimation — all in-house."
        icon={<Layers className="h-5 w-5 text-sage" aria-hidden />}
      />
    </section>
  );
}
