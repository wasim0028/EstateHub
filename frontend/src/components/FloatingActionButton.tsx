"use client";
// src/components/FloatingActionButton.tsx
/**
 * FloatingActionButton — CLIENT COMPONENT
 *
 * A draggable quick-action button that floats above the page. Drag it anywhere;
 * its position is remembered for the session and it stays clamped inside the
 * viewport on resize. Tap (without dragging) to open a small menu of shortcuts.
 *
 * Pointer Events are used rather than mouse/touch handlers so the same code
 * path covers mouse, touch and stylus. A 4px movement threshold distinguishes
 * a drag from a tap, so dragging never accidentally fires the menu.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Home, Search, Heart, Mail, Plus, X } from "lucide-react";

const SIZE = 56;      // button diameter in px
const MARGIN = 16;    // keep this clear of the viewport edges
const DRAG_THRESHOLD = 4;

type Position = { x: number; y: number };

const ACTIONS = [
  { href: "/", label: "Home", Icon: Home },
  { href: "/properties", label: "Browse", Icon: Search },
  { href: "/wishlist", label: "Shortlist", Icon: Heart },
  { href: "/contact", label: "Contact", Icon: Mail },
];

export function FloatingActionButton() {
  const [pos, setPos] = useState<Position | null>(null);
  const [open, setOpen] = useState(false);
  const [dragging, setDragging] = useState(false);

  const dragState = useRef({ moved: false, offsetX: 0, offsetY: 0 });

  const clamp = useCallback((p: Position): Position => {
    const maxX = window.innerWidth - SIZE - MARGIN;
    const maxY = window.innerHeight - SIZE - MARGIN;
    return {
      x: Math.min(Math.max(p.x, MARGIN), Math.max(maxX, MARGIN)),
      y: Math.min(Math.max(p.y, MARGIN), Math.max(maxY, MARGIN)),
    };
  }, []);

  // Initial position: bottom-right. Done in an effect because window isn't
  // available during server rendering.
  useEffect(() => {
    setPos(
      clamp({
        x: window.innerWidth - SIZE - 24,
        y: window.innerHeight - SIZE - 24,
      })
    );
  }, [clamp]);

  // Keep the button on screen when the window is resized
  useEffect(() => {
    const onResize = () => setPos((p) => (p ? clamp(p) : p));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [clamp]);

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!pos) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragState.current = {
      moved: false,
      offsetX: e.clientX - pos.x,
      offsetY: e.clientY - pos.y,
    };
    setDragging(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!dragging) return;
    const next = {
      x: e.clientX - dragState.current.offsetX,
      y: e.clientY - dragState.current.offsetY,
    };
    if (
      Math.abs(next.x - (pos?.x ?? 0)) > DRAG_THRESHOLD ||
      Math.abs(next.y - (pos?.y ?? 0)) > DRAG_THRESHOLD
    ) {
      dragState.current.moved = true;
    }
    setPos(clamp(next));
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    setDragging(false);
    // Only treat it as a tap if the pointer barely moved
    if (!dragState.current.moved) setOpen((o) => !o);
  };

  if (!pos) return null;

  // Open the menu upward/leftward when the button sits near an edge
  const openUpward = pos.y > window.innerHeight / 2;
  const openLeftward = pos.x > window.innerWidth / 2;

  return (
    <div
      className="fixed z-[60]"
      style={{ left: pos.x, top: pos.y, touchAction: "none" }}
    >
      {open && (
        <div
          className={`absolute flex flex-col gap-2 ${
            openUpward ? "bottom-full mb-3" : "top-full mt-3"
          } ${openLeftward ? "right-0 items-end" : "left-0 items-start"}`}
        >
          {ACTIONS.map(({ href, label, Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 pl-3 pr-4 py-2 rounded-full bg-white dark:bg-slate-800 shadow-lg border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 whitespace-nowrap transition-colors"
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </div>
      )}

      <button
        type="button"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        aria-label={open ? "Close quick actions" : "Open quick actions"}
        aria-expanded={open}
        className={`w-14 h-14 rounded-full bg-brand-600 hover:bg-brand-700 text-white shadow-xl flex items-center justify-center transition-colors select-none ${dragging ? "cursor-grabbing scale-105" : "cursor-grab"}`}
        style={{ transition: dragging ? "none" : "transform 120ms ease" }}
      >
        {open ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
      </button>
    </div>
  );
}
