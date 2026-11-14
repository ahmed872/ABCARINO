"use client";

import { useEffect, useRef, useState } from "react";
import type { RenoLocale } from "@/content/reno/faq";
import { RENO_CONFIG } from "@/lib/reno/config";
import type { Dictionary } from "@/lib/i18n";
import { RenoArt, type RenoMood } from "./RenoArt";

/**
 * out → wait (a point of light, while the page finishes loading) → count (the ring opens,
 * the year runs back from 2186) → arrive (RENO appears in 2026, his name fades in) →
 * reveal (the page returns and he glides to his corner).
 */
type Scene = "out" | "wait" | "count" | "arrive" | "reveal";

const FROM_YEAR = 2186;
const TO_YEAR = 2026;
const BRAND = { en: "ABCARINO", ar: "عبقرينو" } as const;

/** The year, counting down on its own so the rest of the intro never re-renders per frame. */
function RenoYear({ running, done, durationMs }: { running: boolean; done: boolean; durationMs: number }) {
  const [year, setYear] = useState(done ? TO_YEAR : FROM_YEAR);
  useEffect(() => {
    if (!running || done) return;
    let raf = 0;
    const start = performance.now();
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / durationMs);
      const eased = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      setYear(Math.round(FROM_YEAR - (FROM_YEAR - TO_YEAR) * eased));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [running, done, durationMs]);
  return <span className="reno-year">{done ? TO_YEAR : year}</span>;
}

/**
 * RENO's arrival from 2186: quiet, centred, a few seconds long. Mounted only after the page
 * has rendered, so it never delays content or LCP, and it moves nothing but transforms and
 * opacity. There is no skip button on screen; Esc (and a keyboard-only button) still end it.
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
  t: Dictionary["reno"];
  reduced: boolean;
  onDone: (how: "seen" | "skipped") => void;
}) {
  const [scene, setScene] = useState<Scene>("out");
  const [mood, setMood] = useState<RenoMood>(reduced ? "hello" : "chill");
  const rootRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const finished = useRef(false);
  const timers = useRef<number[]>([]);

  const finish = (how: "seen" | "skipped") => {
    if (finished.current) return;
    finished.current = true;
    timers.current.forEach((h) => window.clearTimeout(h));
    setScene("out");
    window.setTimeout(() => onDone(how), how === "skipped" ? 250 : 0);
  };

  useEffect(() => {
    const root = document.documentElement;
    const prevOverflow = root.style.overflow;
    const prevFocus = document.activeElement as HTMLElement | null;
    root.style.overflow = "hidden";
    rootRef.current?.focus({ preventScroll: true });
    const at = (ms: number, fn: () => void) => timers.current.push(window.setTimeout(fn, ms));
    const tl = RENO_CONFIG.intro.timeline;

    const play = () => {
      at(0, () => setScene("count"));
      at(tl.arrive, () => setScene("arrive"));
      at(tl.hello, () => setMood("hello"));
      at(tl.reveal, () => {
        // The page comes back and RENO glides to the companion's corner.
        const hero = heroRef.current;
        if (hero) {
          const r = hero.getBoundingClientRect();
          const stacked = stackAboveWhatsApp && locale !== "ar" && window.innerWidth < 1024;
          const targetX = window.innerWidth - 20 - 32;
          const targetY = window.innerHeight - 20 - 32 - (stacked ? 68 : 0);
          const scale = 76 / r.height;
          hero.style.transform = `translate(${targetX - (r.left + r.width / 2)}px, ${targetY - (r.top + r.height / 2)}px) scale(${scale.toFixed(3)})`;
        }
        setMood("chill");
        setScene("reveal");
      });
      at(tl.done, () => finish("seen"));
    };

    let onLoad: (() => void) | undefined;
    at(16, () => setScene(reduced ? "arrive" : "wait"));
    if (reduced) {
      at(RENO_CONFIG.intro.reducedMotionHoldMs, () => finish("seen"));
    } else {
      // Start once the page has finished loading (so nothing competes with the animation),
      // but never keep the visitor waiting on a slow connection.
      let started = false;
      const start = () => {
        if (started) return;
        started = true;
        play();
      };
      at(tl.minWait, () => {
        if (document.readyState === "complete") return start();
        onLoad = () => at(120, start);
        window.addEventListener("load", onLoad, { once: true });
        at(tl.maxWait - tl.minWait, start);
      });
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") finish("skipped");
    };
    window.addEventListener("keydown", onKey);
    const list = timers.current;
    return () => {
      list.forEach((h) => window.clearTimeout(h));
      if (onLoad) window.removeEventListener("load", onLoad);
      window.removeEventListener("keydown", onKey);
      root.style.overflow = prevOverflow;
      if (prevFocus && document.contains(prevFocus)) prevFocus.focus({ preventScroll: true });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once per mount
  }, []);

  const ti = t.intro;
  const arrived = scene === "arrive" || scene === "reveal";

  return (
    <div
      ref={rootRef}
      tabIndex={-1}
      className="reno-intro"
      data-scene={scene}
      data-reduced={reduced ? "true" : "false"}
      role="dialog"
      aria-modal="true"
      aria-label={ti.label}
      lang={locale}
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      <div className="reno-bg" aria-hidden="true" />

      <div className="reno-col">
        <div className="reno-year-wrap" aria-hidden="true">
          <RenoYear running={scene === "count"} done={arrived || reduced} durationMs={RENO_CONFIG.intro.timeline.arrive} />
        </div>

        <div className="reno-stage" aria-hidden="true">
          <div className="reno-ring">
            <i />
          </div>
          <div className="reno-spark" />
          <div ref={heroRef} className="reno-hero">
            <RenoArt mood={mood} />
          </div>
        </div>

        {/* The name card: who just arrived. */}
        <div className="reno-title" aria-hidden="true">
          <span className="reno-title-brand">{BRAND[locale]}</span>
          <span className="reno-title-name">{t.name}</span>
          <span className="reno-title-sub">{t.subtitle}</span>
        </div>
      </div>

      <p className="sr-only" aria-live="polite">
        {arrived ? ti.arrived : ""}
      </p>
      <button type="button" className="reno-skip" onClick={() => finish("skipped")}>
        {ti.skip}
      </button>
    </div>
  );
}
