"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { Flip } from "gsap/Flip";

gsap.registerPlugin(Flip, useGSAP);

export { Flip, gsap, useGSAP };

export function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Shelf reflow (sorting, filtering, moving a book between shelves) uses FLIP:
 * record where every spine is *before* the state change, then let the bookcase
 * animate from those positions after React re-renders.
 */
let pendingShelfLayout: Flip.FlipState | null = null;

export function captureShelfLayout() {
  if (prefersReducedMotion()) return;
  pendingShelfLayout = Flip.getState("[data-flip-id]");
}

export function takeShelfLayout() {
  const state = pendingShelfLayout;
  pendingShelfLayout = null;
  return state;
}
