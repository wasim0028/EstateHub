"use client";
// src/components/property/ImageGallery.tsx
import { useState } from "react";
import Image from "next/image";
import type { PropertyImage } from "@/types";

interface ImageGalleryProps {
  images: PropertyImage[];
  title: string;
}

export function ImageGallery({ images, title }: ImageGalleryProps) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  if (!images || images.length === 0) {
    return (
      <div className="w-full aspect-[16/9] bg-slate-100 dark:bg-slate-800 rounded-2xl flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-800">
        <span className="text-5xl mb-3">🏠</span>
        <p className="text-sm">No photos yet</p>
      </div>
    );
  }

  const active = images[activeIdx];

  return (
    <>
      {/* Main image */}
      <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 cursor-zoom-in" onClick={() => setLightbox(true)}>
        <Image
          src={active.image_url}
          alt={active.caption || title}
          fill
          sizes="(max-width: 1024px) 100vw, 70vw"
          className="object-cover"
          priority
        />
        {/* Overlay controls */}
        <div className="absolute inset-0 flex items-center justify-between px-3 opacity-0 hover:opacity-100 transition-opacity">
          <button onClick={(e) => { e.stopPropagation(); setActiveIdx((i) => (i - 1 + images.length) % images.length); }}
            className="w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition">
            ‹
          </button>
          <button onClick={(e) => { e.stopPropagation(); setActiveIdx((i) => (i + 1) % images.length); }}
            className="w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition">
            ›
          </button>
        </div>
        <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-3 py-1 rounded-full">
          {activeIdx + 1} / {images.length}
        </div>
        <div className="absolute top-3 right-3 bg-black/50 text-white text-xs px-3 py-1 rounded-full flex items-center gap-1">
          🔍 View all
        </div>
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button key={img.id} onClick={() => setActiveIdx(i)}
              className={`relative w-20 h-14 rounded-lg overflow-hidden shrink-0 border-2 transition-all ${
                i === activeIdx ? "border-brand-500" : "border-transparent opacity-70 hover:opacity-100"
              }`}>
              <Image src={img.image_url} alt={img.caption || `Photo ${i + 1}`} fill className="object-cover" sizes="80px" />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center" onClick={() => setLightbox(false)}>
          <button className="absolute top-4 right-4 text-white text-2xl w-10 h-10 flex items-center justify-center hover:bg-white/10 dark:hover:bg-slate-800/10 rounded-full">✕</button>
          <button onClick={(e) => { e.stopPropagation(); setActiveIdx((i) => (i - 1 + images.length) % images.length); }}
            className="absolute left-4 text-white text-3xl w-12 h-12 flex items-center justify-center hover:bg-white/10 dark:hover:bg-slate-800/10 rounded-full">‹</button>
          <div className="relative w-full max-w-4xl aspect-video mx-8" onClick={(e) => e.stopPropagation()}>
            <Image src={active.image_url} alt={active.caption || title} fill className="object-contain" sizes="100vw" />
          </div>
          <button onClick={(e) => { e.stopPropagation(); setActiveIdx((i) => (i + 1) % images.length); }}
            className="absolute right-4 text-white text-3xl w-12 h-12 flex items-center justify-center hover:bg-white/10 dark:hover:bg-slate-800/10 rounded-full">›</button>
          {active.caption && (
            <p className="absolute bottom-6 left-0 right-0 text-center text-white/70 text-sm">{active.caption}</p>
          )}
        </div>
      )}
    </>
  );
}
