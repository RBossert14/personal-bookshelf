"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Flips to true the first time the element scrolls into view, then stops observing.
 * Pair with the `.reveal-on-scroll` class, which plays its animation once
 * `data-in-view="true"` is set.
 */
export function useInView<T extends Element>({ threshold = 0.2, rootMargin = "0px 0px -10% 0px" } = {}) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element || inView) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [inView, threshold, rootMargin]);

  return [ref, inView] as const;
}
