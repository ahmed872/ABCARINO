"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RenoLocale } from "@/content/reno/faq";
import { RENO_CONFIG, readSession, writeSession } from "@/lib/reno/config";
import type { Dictionary } from "@/lib/i18n";
import { RenoArt, type RenoMood } from "./RenoArt";
import { RenoPanel } from "./RenoPanel";

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
  const panelId = "reno-panel";

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
    <div className="reno-dock" data-stack={stackAboveWhatsApp ? "true" : "false"} lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>
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
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          onFocus={() => setHover(true)}
          onBlur={() => setHover(false)}
        >
          <RenoArt variant="avatar" mood={shownMood} />
        </button>
      </div>
      {open ? <RenoPanel id={panelId} locale={locale} t={t} whatsapp={whatsapp} onClose={close} onMood={setMood} /> : null}
    </div>
  );
}
