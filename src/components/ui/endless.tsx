"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { gsap } from "gsap";
import Image from "next/image";

import { cn } from "@/lib/utils";

export interface EndlessItem {
  src: string;
  alt: string;
}

export interface EndlessProps {
  items: EndlessItem[];
  /** Bold line centered in front of the corridor. */
  title?: string;
  /** Smaller muted line beneath the title. */
  caption?: string;
  /** Small decorative mark between the title and the caption — pass an already-rendered icon element (e.g. `<Layers className="h-5 w-5 text-sage" />`), not a component reference: this crosses the server/client boundary, which can't serialize functions. */
  icon?: ReactNode;
  /** Seconds for one image to travel from the back of the corridor to the front. */
  duration?: number;
  /** `sizes` hint for next/image — keep in step with the plane width computed in getLayout(). */
  imageSizes?: string;
  className?: string;
}

const Z_FAR = -2400;
const Z_NEAR = 780;
const RANGE = Z_NEAR - Z_FAR;
const FADE_IN = 0.06;
const FADE_OUT = 0.04;

function opacityForProgress(progress: number) {
  if (progress < FADE_IN) return Math.max(0, progress / FADE_IN);
  if (progress > 1 - FADE_OUT) return Math.max(0, (1 - progress) / FADE_OUT);
  return 1;
}

function getLayout() {
  const width = window.innerWidth;
  const planeW = width < 768 ? Math.min(width * 0.26, 200) : Math.min(width * 0.26, 440);
  return {
    planeW,
    planeH: planeW * (4 / 3),
    offsetX: width * 0.33,
    angle: 24,
  };
}

/** A continuous 3D corridor of images drifting from the horizon toward the viewer, alternating left/right. */
export function Endless({
  items,
  title,
  caption,
  icon,
  duration = 16,
  imageSizes = "(max-width: 768px) 200px, 440px",
  className,
}: EndlessProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const total = items.length;

  useEffect(() => {
    const root = rootRef.current;
    const world = worldRef.current;
    if (!root || !world || total === 0) return;

    // iOS WebKit flattens nested 3D transforms when an ancestor clips overflow.
    if (window.CSS?.supports?.("-webkit-touch-callout: none")) {
      root.style.overflow = "visible";
      root.style.clipPath = "inset(0)";
    }

    const planes = Array.from(world.querySelectorAll<HTMLElement>("[data-endless-plane]"));
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const tweens: gsap.core.Tween[] = [];

    gsap.ticker.lagSmoothing(0);

    const applyLayout = () => {
      const { planeW, planeH, offsetX, angle } = getLayout();
      planes.forEach((plane, index) => {
        const isLeft = index % 2 === 0;
        plane.style.width = `${planeW}px`;
        plane.style.height = `${planeH}px`;
        gsap.set(plane, {
          xPercent: -50,
          yPercent: -50,
          x: isLeft ? -offsetX : offsetX,
          y: 0,
          rotationY: isLeft ? angle : -angle,
          force3D: true,
        });
      });
    };

    applyLayout();

    planes.forEach((plane, index) => {
      const startProgress = index / total;

      gsap.set(plane, { z: Z_FAR + startProgress * RANGE });
      plane.style.opacity = String(opacityForProgress(startProgress));
      plane.style.zIndex = String(Math.round(startProgress * 1000));

      if (reduceMotion) return;

      const tween = gsap.fromTo(
        plane,
        { z: Z_FAR },
        {
          z: Z_NEAR,
          duration,
          ease: "none",
          repeat: -1,
          immediateRender: false,
          onUpdate() {
            const progress = this.progress();
            plane.style.opacity = String(opacityForProgress(progress));
            plane.style.zIndex = String(Math.round(progress * 1000));
          },
        },
      );

      tween.progress(startProgress);
      tweens.push(tween);
    });

    window.addEventListener("resize", applyLayout);

    return () => {
      window.removeEventListener("resize", applyLayout);
      tweens.forEach((tween) => tween.kill());
      gsap.killTweensOf(planes);
    };
  }, [items, total, duration]);

  return (
    <div
      ref={rootRef}
      className={cn(
        "relative h-full w-full select-none overflow-hidden bg-ink pointer-events-none",
        className,
      )}
      style={{ perspective: "1100px" }}
    >
      <div ref={worldRef} className="absolute inset-0" style={{ transformStyle: "preserve-3d" }}>
        {items.map((item, index) => (
          <div
            key={`${item.src}-${index}`}
            data-endless-plane
            className="absolute left-1/2 top-1/2 origin-center overflow-hidden bg-ink will-change-transform"
            style={{ transformStyle: "preserve-3d", backfaceVisibility: "hidden" }}
          >
            <Image
              src={item.src}
              alt={item.alt}
              fill
              sizes={imageSizes}
              quality={80}
              className="object-cover"
            />
          </div>
        ))}
      </div>

      {title && (
        <h2 className="absolute left-1/2 top-1/2 z-50 w-max max-w-[85vw] -translate-x-1/2 -translate-y-1/2 text-center font-display text-base font-semibold leading-tight tracking-[0.08em] text-warm-bone md:text-2xl lg:text-3xl">
          {title.split("\n").map((line, index) => (
            <span key={index} className="block">
              {line}
            </span>
          ))}
        </h2>
      )}

      {(icon || caption) && (
        <div className="absolute bottom-10 left-1/2 z-50 flex w-max max-w-[85vw] -translate-x-1/2 flex-col items-center gap-2 md:bottom-8">
          {icon}
          {caption && (
            <p className="text-center font-ui text-sm font-medium tracking-wide text-sage">
              {caption}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default Endless;
