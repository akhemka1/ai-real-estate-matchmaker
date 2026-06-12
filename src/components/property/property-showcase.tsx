"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Expand, Images, X } from "lucide-react";

import { cn } from "@/lib/utils";

interface PropertyShowcaseProps {
  images: string[];
  alt: string;
  className?: string;
}

/**
 * Editorial gallery: a magazine-style mosaic (hero + grid) with a fullscreen,
 * keyboard-navigable lightbox. Designed to feel like a flagship listing page.
 */
export function PropertyShowcase({ images, alt, className }: PropertyShowcaseProps) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  const count = images.length;
  const go = useCallback(
    (dir: number) => setIndex((i) => (i + dir + count) % count),
    [count]
  );
  const openAt = (i: number) => {
    setIndex(i);
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, go]);

  if (count === 0) {
    return (
      <div
        className={cn(
          "flex aspect-[16/9] items-center justify-center rounded-3xl border bg-muted text-muted-foreground",
          className
        )}
      >
        No images available
      </div>
    );
  }

  const hero = images[0];
  const tiles = images.slice(1, 5);

  return (
    <div className={className}>
      {/* Mobile: single hero with a "view all" affordance */}
      <button
        type="button"
        onClick={() => openAt(0)}
        className="group relative block aspect-[4/3] w-full overflow-hidden rounded-3xl border shadow-card sm:hidden"
      >
        <Image src={hero} alt={alt} fill className="object-cover" sizes="100vw" priority />
        <span className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/55 to-transparent" />
        <span className="glass absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold">
          <Images className="h-3.5 w-3.5" /> {count} photos
        </span>
      </button>

      {/* Desktop: magazine mosaic */}
      <div className="hidden sm:block">
        <div className="relative grid h-[clamp(360px,52vh,560px)] grid-cols-4 grid-rows-2 gap-2 overflow-hidden rounded-3xl border bg-muted shadow-card">
          <button
            type="button"
            onClick={() => openAt(0)}
            className="group relative col-span-2 row-span-2 overflow-hidden"
            aria-label="Open photo 1"
          >
            <Image
              src={hero}
              alt={alt}
              fill
              priority
              sizes="(max-width: 1024px) 50vw, 640px"
              className="object-cover transition-transform duration-500 ease-premium group-hover:scale-[1.04]"
            />
          </button>

          {tiles.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => openAt(i + 1)}
              className="group relative overflow-hidden"
              aria-label={`Open photo ${i + 2}`}
            >
              <Image
                src={src}
                alt={`${alt} — photo ${i + 2}`}
                fill
                sizes="(max-width: 1024px) 25vw, 320px"
                className="object-cover transition-transform duration-500 ease-premium group-hover:scale-[1.06]"
              />
              <span className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10" />
            </button>
          ))}

          <button
            type="button"
            onClick={() => openAt(0)}
            className="glass absolute bottom-4 right-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold shadow-card transition-transform hover:scale-[1.03]"
          >
            <Expand className="h-4 w-4" />
            Show all {count} photos
          </button>
        </div>
      </div>

      {/* Lightbox */}
      {open && (
        <div
          className="fixed inset-0 z-[100] flex flex-col bg-black/92 backdrop-blur-sm animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-label={`${alt} photo gallery`}
        >
          <div className="flex items-center justify-between px-4 py-4 text-white/90 sm:px-6">
            <span className="text-sm font-medium tabular-nums">
              {index + 1} / {count}
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full p-2 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Close gallery"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div
            className="relative flex flex-1 items-center justify-center px-4 sm:px-16"
            onClick={() => setOpen(false)}
          >
            <div
              className="relative h-full max-h-[72vh] w-full max-w-5xl"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={images[index]}
                alt={`${alt} — photo ${index + 1}`}
                fill
                sizes="100vw"
                className="object-contain animate-scale-in"
              />
            </div>

            {count > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    go(-1);
                  }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white transition-colors hover:bg-white/20 sm:left-6"
                  aria-label="Previous photo"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    go(1);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white transition-colors hover:bg-white/20 sm:right-6"
                  aria-label="Next photo"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}
          </div>

          {count > 1 && (
            <div className="flex justify-center gap-2 overflow-x-auto px-4 py-5">
              {images.map((src, i) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => setIndex(i)}
                  className={cn(
                    "relative size-16 shrink-0 overflow-hidden rounded-lg ring-2 transition-all",
                    i === index ? "ring-white" : "opacity-50 ring-transparent hover:opacity-90"
                  )}
                  aria-label={`Go to photo ${i + 1}`}
                  aria-current={i === index}
                >
                  <Image src={src} alt="" fill sizes="64px" className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
