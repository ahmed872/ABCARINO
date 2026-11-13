"use client";

import { useEffect, useRef, useState } from "react";
import type { RenoLocale } from "@/content/reno/faq";
import { RENO_CONFIG } from "@/lib/reno/config";
import type { Dictionary } from "@/lib/i18n";
import { RenoArt, type RenoMood } from "./RenoArt";

type Scene = "future" | "open" | "travel" | "arrive" | "reveal" | "out";

const FROM_YEAR = 2186;
const TO_YEAR = 2026;

const PARTICLES = Array.from({ length: 14 }, (_, i) => {
  const a = (i / 14) * Math.PI * 2;
  const r = 140 + (i % 3) * 40;
  return { dx: `${Math.round(Math.cos(a) * r)}px`, dy: `${Math.round(Math.sin(a) * r)}px`, delay: `${(i % 7) * 0.4}s` };
});

/**
 * RENO's arrival from 2186: the future → the portal opens → time travel → arrival in
 * 2026 → the page is revealed and RENO settles into his corner. Mounted only after the
 * page has rendered, so it never delays content or LCP. Skippable (button or Esc).
 */
export function RenoIntro({
  locale,
  t,
  reduced,
  stackAboveWhatsApp,
  onDone,
}: {
  locale: RenoLocale;
  stackAboveWhatsApp: boolean;
  t: Dictionary["reno"]["intro"];
  reduced: boolean;
  onDone: (how: "seen" | "skipped") => void;
}) {
  const [scene, setScene] = useState<Scene>("out");
  const [year, setYear] = useState(reduced ? TO_YEAR : FROM_YEAR);
  const [mood, setMood] = useState<RenoMood>(reduced ? "hello" : "chill");
  const [emerging, setEmerging] = useState(false);
  const [tuning, setTuning] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const skipRef = useRef<HTMLButtonElement>(null);
  const finished = useRef(false);
  const timers = useRef<number[]>([]);

  const finish = (how: "seen" | "skipped") => {
    if (finished.current) return;
    finished.current = true;
    timers.current.forEach((h) => window.clearTimeout(h));
    setScene("out");
    window.setTimeout(() => onDone(how), how === "skipped" ? 200 : 0);
  };

  useEffect(() => {
    const root = document.documentElement;
    const prevOverflow = root.style.overflow;
    const prevFocus = document.activeElement as HTMLElement | null;
    root.style.overflow = "hidden";
    skipRef.current?.focus({ preventScroll: true });
    const at = (ms: number, fn: () => void) => timers.current.push(window.setTimeout(fn, ms));
    const tl = RENO_CONFIG.intro.timeline;
    let raf = 0;

    // Fade in from the already-rendered page (it "dims into space").
    at(16, () => setScene(reduced ? "arrive" : "future"));
    if (reduced) {
      at(RENO_CONFIG.intro.reducedMotionHoldMs, () => finish("seen"));
    } else {
      at(tl.open, () => setScene("open"));
      at(tl.open + 350, () => setTuning(true)); // adjusts his headphones: the rings flare
      at(tl.open + 1000, () => setTuning(false));
      at(tl.travel, () => {
        setScene("travel");
        const start = performance.now();
        const span = tl.arrive - tl.travel;
        const step = (now: number) => {
          const p = Math.min(1, (now - start) / span);
          setYear(Math.round(FROM_YEAR - (FROM_YEAR - TO_YEAR) * (1 - Math.pow(1 - p, 2))));
          if (p < 1) raf = requestAnimationFrame(step);
        };
        raf = requestAnimationFrame(step);
      });
      at(tl.arrive, () => {
        setEmerging(true);
        setScene("arrive");
        requestAnimationFrame(() => requestAnimationFrame(() => setEmerging(false)));
      });
      at(tl.arrive + 450, () => setMood("hello"));
      at(tl.reveal, () => {
        // Fly to the companion's corner.
        const hero = heroRef.current;
        if (hero) {
          const r = hero.getBoundingClientRect();
          const stacked = stackAboveWhatsApp && locale !== "ar" && window.innerWidth < 1024;
          const targetX = window.innerWidth - 20 - 32;
          const targetY = window.innerHeight - 20 - 32 - (stacked ? 68 : 0);
          hero.style.transform = `translate(${targetX - (r.left + r.width / 2)}px, ${targetY - (r.top + r.height / 2)}px) scale(0.14)`;
        }
        setScene("reveal");
      });
      at(tl.done, () => finish("seen"));
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") finish("skipped");
    };
    window.addEventListener("keydown", onKey);
    const list = timers.current;
    return () => {
      list.forEach((h) => window.clearTimeout(h));
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKey);
      root.style.overflow = prevOverflow;
      if (prevFocus && document.contains(prevFocus)) prevFocus.focus({ preventScroll: true });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once per mount
  }, []);

  const caption = scene === "future" || scene === "open" ? t.departing : scene === "travel" ? t.warping : t.arrived;

  return (
    <div
      className="reno-intro"
      data-scene={scene}
      data-reduced={reduced ? "true" : "false"}
      role="dialog"
      aria-modal="true"
      aria-label={t.label}
      lang={locale}
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      <div className="reno-stars" aria-hidden="true" />
      <div className="reno-hud" aria-hidden="true">
        <span>{t.year}</span>
        <span className="reno-year">{year}</span>
        <span className="reno-route">
          <span>
            {t.from} {FROM_YEAR}
          </span>
          <span className="reno-bar">
            <i />
          </span>
          <span>
            {t.to} {TO_YEAR}
          </span>
        </span>
      </div>

      <div className="reno-stage" aria-hidden="true">
        <div className="reno-warp" />
        <div className="reno-portal">
          <div className="reno-core" />
          <svg viewBox="0 0 200 200">
            <defs>
              <filter id="reno-portal-glow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="3" />
              </filter>
            </defs>
            <circle cx="100" cy="100" r="92" fill="none" stroke="#FF5B1F" strokeWidth="6" filter="url(#reno-portal-glow)" opacity="0.8" />
            <circle cx="100" cy="100" r="92" fill="none" stroke="#FF7A2E" strokeWidth="2.5" />
            <circle className="reno-ring-a" cx="100" cy="100" r="82" fill="none" stroke="#FFC98A" strokeOpacity="0.55" strokeWidth="1.2" strokeDasharray="1 7" />
            <circle className="reno-ring-b" cx="100" cy="100" r="72" fill="none" stroke="#FF5B1F" strokeOpacity="0.6" strokeWidth="1.5" strokeDasharray="18 10 4 10" />
          </svg>
          {PARTICLES.map((p, i) => (
            <span key={i} className="reno-particle" style={{ ["--dx" as string]: p.dx, ["--dy" as string]: p.dy, animationDelay: p.delay }} />
          ))}
        </div>
        <div ref={heroRef} className={`reno-hero${emerging ? " reno-emerge" : ""}${tuning ? " reno-tuning" : ""}`}>
          <RenoArt mood={mood} />
        </div>
      </div>

      <p className="reno-caption" aria-live="polite">
        {caption}
      </p>
      <button ref={skipRef} type="button" className="reno-skip" onClick={() => finish("skipped")}>
        {t.skip}
      </button>
    </div>
  );
}
