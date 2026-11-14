"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RenoLocale } from "@/content/reno/faq";
import { RENO_CONFIG, prefersReducedMotion, readSession, writeSession } from "@/lib/reno/config";
import type { Dictionary } from "@/lib/i18n";
import { loadKnowledge } from "./knowledge-client";
import { RenoArt, type RenoMood } from "./RenoArt";
import { RenoPanel } from "./RenoPanel";

/** Where he glances when nobody is moving a mouse (SVG units: x, y). */
const GLANCES: ReadonlyArray<readonly [number, number]> = [[-6, -2], [5, -3], [-4, 2], [6, 1], [0, -4]];

/** RENO in the page corner: idle life, hover reaction, one idle speech bubble per session, and the FAQ panel. */
export function RenoCompanion({
  locale,
  t,
  whatsapp,
  stackAboveWhatsApp,
  arriving,
}: {
  locale: RenoLocale;
  t: Dictionary["reno"];
  whatsapp: string | null;
  stackAboveWhatsApp: boolean;
  arriving: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [mood, setMood] = useState<RenoMood>(arriving ? "hello" : "chill");
  const [hover, setHover] = useState(false);
  const [bubble, setBubble] = useState<string | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = "reno-panel";

  // His eyes follow the mouse; without one (or when it rests) he glances around on his own.
  useEffect(() => {
    const root = rootRef.current;
    if (!root || prefersReducedMotion()) return;
    let raf = 0;
    let lastMove = 0;
    let turn = 0;
    let back: number | undefined;
    const look = (x: number, y: number) => {
      root.style.setProperty("--reno-look-x", x.toFixed(2));
      root.style.setProperty("--reno-look-y", y.toFixed(2));
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      lastMove = performance.now();
      if (raf) return;
      const { clientX, clientY } = e;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const b = buttonRef.current?.getBoundingClientRect();
        if (!b) return;
        const dx = clientX - (b.left + b.width / 2);
        const dy = clientY - (b.top + b.height / 2);
        const d = Math.hypot(dx, dy) || 1;
        const reach = Math.min(1, d / 220);
        look((dx / d) * 7 * reach, (dy / d) * 4.5 * reach);
      });
    };
    const idle = window.setInterval(() => {
      if (performance.now() - lastMove < 4000) return;
      const [x, y] = GLANCES[turn++ % GLANCES.length];
      look(x, y);
      back = window.setTimeout(() => look(0, 0), 1200);
    }, 5200);
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.clearInterval(idle);
      window.clearTimeout(back);
      cancelAnimationFrame(raf);
    };
  }, []);

  // Fetch the site's live knowledge once the page has settled, so the first answer is instant.
  useEffect(() => {
    const h = window.setTimeout(() => void loadKnowledge(locale), 3500);
    return () => window.clearTimeout(h);
  }, [locale]);

  useEffect(() => {
    if (!arriving) return;
    const h = window.setTimeout(() => setMood("chill"), 1800);
    return () => window.clearTimeout(h);
  }, [arriving]);

  // One gentle idle nudge per session, only if the visitor hasn't opened RENO.
  useEffect(() => {
    if (open || readSession(RENO_CONFIG.storage.bubble)) return;
    let shown: number | undefined;
    const show = window.setTimeout(() => {
      writeSession(RENO_CONFIG.storage.bubble, "1");
      setBubble(t.idle[new Date().getSeconds() % t.idle.length]);
      setMood("hello");
      shown = window.setTimeout(() => {
        setBubble(null);
        setMood("chill");
      }, RENO_CONFIG.companion.idleBubbleForMs);
    }, RENO_CONFIG.companion.idleBubbleAfterMs);
    return () => {
      window.clearTimeout(show);
      if (shown) window.clearTimeout(shown);
    };
  }, [open, t.idle]);

  const close = useCallback(() => {
    setOpen(false);
    setMood("chill");
    buttonRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  function toggle() {
    setBubble(null);
    writeSession(RENO_CONFIG.storage.bubble, "1");
    if (open) return close();
    setOpen(true);
    setMood("hello");
    window.setTimeout(() => setMood((m) => (m === "hello" ? "chill" : m)), 1600);
  }

  const shownMood: RenoMood = hover && mood === "chill" && !open ? "hello" : mood;

  return (
    <div ref={rootRef} className="reno-root" data-stack={stackAboveWhatsApp ? "true" : "false"} lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>
      <div className="reno-dock">
        {bubble && !open ? (
          <div className="reno-bubble" onClick={toggle} aria-hidden="true">
            {bubble}
          </div>
        ) : null}
        <div className="reno-float">
          <button
            ref={buttonRef}
            type="button"
            className="reno-launch"
            data-arriving={arriving ? "true" : "false"}
            aria-label={open ? t.close : t.open}
            aria-expanded={open}
            aria-controls={open ? panelId : undefined}
            onClick={toggle}
            onPointerEnter={(e) => e.pointerType === "mouse" && setHover(true)}
            onPointerLeave={() => setHover(false)}
            onFocus={() => setHover(true)}
            onBlur={() => setHover(false)}
          >
            <span className="reno-face">
              <RenoArt variant="avatar" mood={shownMood} />
            </span>
          </button>
        </div>
      </div>
      {open ? <RenoPanel id={panelId} locale={locale} t={t} whatsapp={whatsapp} onClose={close} onMood={setMood} /> : null}
    </div>
  );
}
