"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Progressive, restrained reveal-on-scroll. Content is fully visible without JS;
 * elements already on screen are never hidden (no flash), and reduced-motion
 * users get no animation at all (see globals.css).
 */
export function RevealObserver() {
  const pathname = usePathname();
  useEffect(() => {
    const root = document.documentElement;
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]:not(.is-visible)"));
    const vh = window.innerHeight;
    for (const el of els) {
      if (el.getBoundingClientRect().top < vh * 0.95) el.classList.add("is-visible");
    }
    root.classList.add("js");
    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("is-visible"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 },
    );
    els.forEach((el) => {
      if (!el.classList.contains("is-visible")) io.observe(el);
    });
    return () => io.disconnect();
  }, [pathname]);
  return null;
}
