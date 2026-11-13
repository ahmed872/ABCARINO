"use client";

import { useEffect, useRef, useState } from "react";
import type { RenoLocale } from "@/content/reno/faq";
import { RENO_CONFIG } from "@/lib/reno/config";
import type { Dictionary } from "@/lib/i18n";
import { RenoArt, type RenoMood } from "./RenoArt";

/**
 * out → future (RENO in 2186) → ignite (the portal draws itself) → jump (into it) →
 * tunnel (time travel) → arrive (lands in 2026, name card) → reveal (iris to his corner).
 */
type Scene = "out" | "future" | "ignite" | "jump" | "tunnel" | "arrive" | "reveal";

const FROM_YEAR = 2186;
const TO_YEAR = 2026;
const BRAND = { en: "ABCARINO", ar: "عبقرينو" } as const;
const TUNNEL_RINGS = [0, 1, 2, 3, 4, 5, 6];

/**
 * RENO's arrival from 2186. Mounted only after the page has rendered, so it never delays
 * content or LCP; everything moves with transforms and opacity. Skippable (button or Esc).
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
  const [year, setYear] = useState(reduced ? TO_YEAR : FROM_YEAR);
  const [mood, setMood] = useState<RenoMood>(reduced ? "hello" : "sip");
  const [tuning, setTuning] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
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
      at(650, () => setMood("chill"));
      at(tl.ignite, () => {
        setScene("ignite");
        setMood("really");
      });
      at(tl.ignite + 120, () => setTuning(true)); // a tap on the headphones: the rings flare
      at(tl.ignite + 800, () => setTuning(false));
      at(tl.jump, () => {
        setScene("jump");
        setMood("chill");
      });
      at(tl.tunnel, () => {
        setScene("tunnel");
        setMood("sip"); // unbothered, tea in hand, 160 years in a second
        const start = performance.now();
        const span = tl.arrive - tl.tunnel;
        const step = (now: number) => {
          const p = Math.min(1, (now - start) / span);
          setYear(Math.round(FROM_YEAR - (FROM_YEAR - TO_YEAR) * (1 - Math.pow(1 - p, 2))));
          if (p < 1) raf = requestAnimationFrame(step);
        };
        raf = requestAnimationFrame(step);
      });
      at(tl.arrive, () => {
        cancelAnimationFrame(raf);
        setYear(TO_YEAR);
        setScene("arrive");
        setMood("chill");
      });
      at(tl.arrive + 380, () => setMood("hello"));
      at(tl.reveal, () => {
        // The overlay closes like an iris onto the companion's corner, and RENO goes with it.
        const stacked = stackAboveWhatsApp && locale !== "ar" && window.innerWidth < 1024;
        const targetX = window.innerWidth - 20 - 32;
        const targetY = window.innerHeight - 20 - 32 - (stacked ? 68 : 0);
        rootRef.current?.style.setProperty("--reno-iris-x", `${targetX}px`);
        rootRef.current?.style.setProperty("--reno-iris-y", `${targetY}px`);
        const hero = heroRef.current;
        if (hero) {
          const r = hero.getBoundingClientRect();
          hero.style.transform = `translate(${targetX - (r.left + r.width / 2)}px, ${targetY - (r.top + r.height / 2)}px) scale(0.12)`;
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

  const ti = t.intro;
  const caption = scene === "tunnel" || scene === "jump" ? ti.warping : scene === "arrive" || scene === "reveal" ? ti.arrived : ti.departing;

  return (
    <div
      ref={rootRef}
      className="reno-intro"
      data-scene={scene}
      data-reduced={reduced ? "true" : "false"}
      role="dialog"
      aria-modal="true"
      aria-label={ti.label}
      lang={locale}
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      <div className="reno-sky" aria-hidden="true" />
      <div className="reno-grid" aria-hidden="true">
        <i />
      </div>
      <div className="reno-horizon" aria-hidden="true" />

      <div className="reno-hud" aria-hidden="true">
        <span className="reno-hud-label">{ti.year}</span>
        <span className="reno-year">{year}</span>
      </div>

      <div className="reno-stage" aria-hidden="true">
        <div className="reno-tunnel">
          {TUNNEL_RINGS.map((i) => (
            <i key={i} style={{ animationDelay: `${(-i * 0.16).toFixed(2)}s` }} />
          ))}
          <b />
        </div>
        <div className="reno-portal">
          <div className="reno-core" />
          <svg viewBox="0 0 200 200">
            <defs>
              <filter id="reno-portal-glow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="3.5" />
              </filter>
            </defs>
            <circle className="reno-ring-draw" cx="100" cy="100" r="92" fill="none" stroke="#FF5B1F" strokeWidth="7" filter="url(#reno-portal-glow)" opacity="0.85" pathLength="100" />
            <circle className="reno-ring-draw" cx="100" cy="100" r="92" fill="none" stroke="#FF8A45" strokeWidth="2.5" pathLength="100" />
            <circle className="reno-ring-a" cx="100" cy="100" r="82" fill="none" stroke="#FFC98A" strokeOpacity="0.6" strokeWidth="1.2" strokeDasharray="1 7" />
            <circle className="reno-ring-b" cx="100" cy="100" r="72" fill="none" stroke="#FF5B1F" strokeOpacity="0.65" strokeWidth="1.5" strokeDasharray="18 10 4 10" />
          </svg>
        </div>
        <div className="reno-shock" />
        <div ref={heroRef} className={`reno-hero${tuning ? " reno-tuning" : ""}`}>
          <div className="reno-hero-fx">
            <RenoArt mood={mood} />
          </div>
        </div>
      </div>

      {/* The name card: who just arrived. */}
      <div className="reno-title" aria-hidden="true">
        <span className="reno-title-brand">{BRAND[locale]}</span>
        <span className="reno-title-name">
          {locale === "ar" ? t.name : [...t.name].map((ch, i) => <span key={i} style={{ animationDelay: `${0.45 + i * 0.07}s` }}>{ch}</span>)}
        </span>
        <span className="reno-title-sub">{t.subtitle}</span>
      </div>

      <div className="reno-flash" aria-hidden="true" />

      <div className="reno-status">
        <span className="reno-route" aria-hidden="true">
          <span>{FROM_YEAR}</span>
          <span className="reno-bar">
            <i />
          </span>
          <span>{TO_YEAR}</span>
        </span>
        <p className="reno-caption" aria-live="polite">
          {caption}
        </p>
      </div>

      <div className="reno-letterbox" aria-hidden="true" />
      <button ref={skipRef} type="button" className="reno-skip" onClick={() => finish("skipped")}>
        {ti.skip}
      </button>
    </div>
  );
}
