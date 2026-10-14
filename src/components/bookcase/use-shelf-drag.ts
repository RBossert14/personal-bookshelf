"use client";

import { useEffect, useRef, type RefObject } from "react";

import type { ShelfStatus } from "@/lib/books/types";
import { captureShelfLayout, gsap, prefersReducedMotion } from "@/lib/motion";

/** How far a mouse has to move before a press becomes a drag rather than a click. */
const DRAG_DISTANCE = 6;
/** Touch drags start with a press and hold, so a swipe still scrolls the shelf. */
const TOUCH_HOLD_MS = 350;
const TOUCH_SLOP = 8;

interface Session {
  pointerId: number;
  pointerType: string;
  bookId: string;
  from: ShelfStatus;
  li: HTMLElement;
  visual: HTMLElement;
  startX: number;
  startY: number;
  x: number;
  y: number;
  holdTimer?: number;
  ghost?: HTMLElement;
  offsetX: number;
  offsetY: number;
  target: HTMLElement | null;
}

/**
 * Drag a spine onto another shelf to move it there. The spine is lifted as a
 * floating copy while its slot fades; on drop the real spine is parked under
 * the copy, so the bookcase's Flip animation slides it from there into place.
 */
export function useShelfDrag(
  root: RefObject<HTMLElement | null>,
  onDrop: (bookId: string, status: ShelfStatus) => void,
  enabled = true,
) {
  const onDropRef = useRef(onDrop);
  useEffect(() => {
    onDropRef.current = onDrop;
  });

  useEffect(() => {
    const container = root.current;
    if (!container || !enabled) return;
    let session: Session | null = null;

    const setTarget = (next: HTMLElement | null) => {
      if (!session || session.target === next) return;
      session.target?.removeAttribute("data-drop-target");
      next?.setAttribute("data-drop-target", "true");
      session.target = next;
    };

    const start = () => {
      const s = session;
      if (!s) return;
      const reduced = prefersReducedMotion();
      const rect = s.visual.getBoundingClientRect();
      s.offsetX = s.startX - rect.left;
      s.offsetY = s.startY - rect.top;

      const ghost = s.visual.cloneNode(true) as HTMLElement;
      ghost.removeAttribute("data-spine-visual");
      ghost.setAttribute("aria-hidden", "true");
      Object.assign(ghost.style, {
        position: "fixed",
        inset: "auto",
        left: `${rect.left}px`,
        top: `${rect.top}px`,
        width: `${rect.width}px`,
        height: `${rect.height}px`,
        margin: "0",
        zIndex: "60",
        pointerEvents: "none",
      });
      document.body.append(ghost);
      s.ghost = ghost;

      gsap.to(ghost, {
        rotation: -4,
        scale: 1.04,
        boxShadow: "0 18px 30px -10px rgb(0 0 0 / 0.55)",
        duration: reduced ? 0 : 0.15,
        ease: "power2.out",
      });
      gsap.to(s.li, { autoAlpha: 0.3, duration: reduced ? 0 : 0.15 });
      document.body.style.userSelect = "none";
      document.body.style.cursor = "grabbing";
      window.getSelection()?.removeAllRanges();
      if (s.pointerType === "touch") navigator.vibrate?.(10);
      move(s.x, s.y);
    };

    const move = (x: number, y: number) => {
      const s = session;
      if (!s?.ghost) return;
      gsap.set(s.ghost, { left: x - s.offsetX, top: y - s.offsetY });
      const shelf = document.elementFromPoint(x, y)?.closest<HTMLElement>("[data-shelf]");
      setTarget(shelf && container.contains(shelf) && shelf.dataset.shelf !== s.from ? shelf : null);
    };

    const finish = () => {
      const s = session;
      if (!s) return;
      window.clearTimeout(s.holdTimer);
      setTarget(null);
      session = null;
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onCancel);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("touchmove", blockScroll);
      window.removeEventListener("contextmenu", blockContextMenu);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };

    const putBack = (s: Session) => {
      const ghost = s.ghost;
      if (!ghost) return;
      const home = s.visual.getBoundingClientRect();
      gsap.to(ghost, {
        left: home.left,
        top: home.top,
        rotation: 0,
        scale: 1,
        boxShadow: "none",
        duration: prefersReducedMotion() ? 0 : 0.25,
        ease: "power2.inOut",
        onComplete: () => {
          ghost.remove();
          gsap.to(s.li, { autoAlpha: 1, duration: 0.1, clearProps: "opacity,visibility" });
        },
      });
    };

    const drop = (s: Session, status: ShelfStatus | undefined) => {
      if (!status || !s.ghost) {
        putBack(s);
        return;
      }
      // Park the real spine where it was dropped, so Flip slides it from there.
      const dropped = s.ghost.getBoundingClientRect();
      const home = s.visual.getBoundingClientRect();
      gsap.set(s.li, { x: dropped.left - home.left, y: dropped.top - home.top, autoAlpha: 1 });
      captureShelfLayout();
      s.ghost.remove();
      onDropRef.current(s.bookId, status);
    };

    // A drag ends with a click on the spine; swallow it so the book doesn't open.
    const suppressNextClick = () => {
      const swallow = (event: MouseEvent) => {
        event.stopPropagation();
        event.preventDefault();
      };
      window.addEventListener("click", swallow, { capture: true, once: true });
      window.setTimeout(() => window.removeEventListener("click", swallow, { capture: true }), 0);
    };

    const onPointerMove = (event: PointerEvent) => {
      const s = session;
      if (!s || event.pointerId !== s.pointerId) return;
      s.x = event.clientX;
      s.y = event.clientY;
      if (s.ghost) {
        move(s.x, s.y);
        return;
      }
      const distance = Math.hypot(s.x - s.startX, s.y - s.startY);
      if (s.pointerType === "touch") {
        if (distance > TOUCH_SLOP) finish(); // a swipe: let the shelf scroll
      } else if (distance > DRAG_DISTANCE) {
        start();
      }
    };

    const onPointerUp = (event: PointerEvent) => {
      const s = session;
      if (!s || event.pointerId !== s.pointerId) return;
      const status = s.target?.dataset.shelf as ShelfStatus | undefined;
      finish();
      if (s.ghost) {
        suppressNextClick();
        drop(s, status);
      }
    };

    const onCancel = () => {
      const s = session;
      if (!s) return;
      finish();
      putBack(s);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && session?.ghost) {
        event.preventDefault();
        onCancel();
      }
    };

    const blockScroll = (event: TouchEvent) => {
      if (session?.ghost) event.preventDefault();
    };
    const blockContextMenu = (event: Event) => {
      if (session) event.preventDefault();
    };

    const onPointerDown = (event: PointerEvent) => {
      if (session || event.button !== 0) return;
      const button = (event.target as HTMLElement).closest<HTMLElement>("[data-flip-id] button");
      const li = button?.closest<HTMLElement>("[data-flip-id]");
      const shelf = li?.closest<HTMLElement>("[data-shelf]");
      const visual = button?.querySelector<HTMLElement>("[data-spine-visual]");
      if (!button || !li || !shelf || !visual || !container.contains(li)) return;

      session = {
        pointerId: event.pointerId,
        pointerType: event.pointerType,
        bookId: li.dataset.flipId!,
        from: shelf.dataset.shelf as ShelfStatus,
        li,
        visual,
        startX: event.clientX,
        startY: event.clientY,
        x: event.clientX,
        y: event.clientY,
        offsetX: 0,
        offsetY: 0,
        target: null,
      };
      if (event.pointerType === "touch") session.holdTimer = window.setTimeout(start, TOUCH_HOLD_MS);

      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);
      window.addEventListener("pointercancel", onCancel);
      window.addEventListener("keydown", onKeyDown);
      window.addEventListener("touchmove", blockScroll, { passive: false });
      window.addEventListener("contextmenu", blockContextMenu);
    };

    container.addEventListener("pointerdown", onPointerDown);
    return () => {
      container.removeEventListener("pointerdown", onPointerDown);
      const s = session;
      finish();
      s?.ghost?.remove();
    };
  }, [root, enabled]);
}
