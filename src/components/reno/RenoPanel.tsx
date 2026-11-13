"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { RENO_CATEGORIES, RENO_FAQ, type RenoAction, type RenoFaq, type RenoLocale } from "@/content/reno/faq";
import { RENO_CONFIG, prefersReducedMotion, readSession, writeSession } from "@/lib/reno/config";
import { faqById, matchQuestion } from "@/lib/reno/matcher";
import type { Dictionary } from "@/lib/i18n";
import { RenoArt, type RenoMood } from "./RenoArt";

type Copy = Dictionary["reno"];

/** Conversation items reference FAQ entries by id, so stored sessions stay valid if wording changes. */
export type RenoMessage =
  | { id: number; from: "reno"; kind: "greeting" }
  | { id: number; from: "user"; text: string }
  | { id: number; from: "reno"; kind: "answer"; faqId: string; quip?: string; suggestionIds: string[] }
  | { id: number; from: "reno"; kind: "suggest"; suggestionIds: string[] }
  | { id: number; from: "reno"; kind: "unknown"; quip?: string };

const GREETING: RenoMessage[] = [{ id: 1, from: "reno", kind: "greeting" }];

function loadChat(locale: RenoLocale): RenoMessage[] {
  const raw = readSession(`${RENO_CONFIG.storage.chat}:${locale}`);
  if (!raw) return GREETING;
  try {
    const parsed = JSON.parse(raw) as RenoMessage[];
    return Array.isArray(parsed) && parsed.length ? parsed.slice(-60) : GREETING;
  } catch {
    return GREETING;
  }
}

const pick = (list: readonly string[], n: number) => list[n % list.length];

export function RenoPanel({
  id,
  locale,
  t,
  whatsapp,
  onClose,
  onMood,
}: {
  id: string;
  locale: RenoLocale;
  t: Copy;
  whatsapp: string | null;
  onClose: () => void;
  onMood: (mood: RenoMood) => void;
}) {
  const [messages, setMessages] = useState<RenoMessage[]>(() => loadChat(locale));
  const [category, setCategory] = useState<string>(RENO_CATEGORIES[0].id);
  const [showTopics, setShowTopics] = useState(() => messages.length <= 1);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    writeSession(`${RENO_CONFIG.storage.chat}:${locale}`, JSON.stringify(messages));
    const log = logRef.current;
    if (log) log.scrollTo({ top: log.scrollHeight, behavior: prefersReducedMotion() ? "auto" : "smooth" });
  }, [messages, locale, busy, showTopics]);

  useEffect(() => {
    inputRef.current?.focus({ preventScroll: true });
    const list = timers.current;
    return () => list.forEach((h) => window.clearTimeout(h));
  }, []);

  function later(fn: () => void, ms: number) {
    timers.current.push(window.setTimeout(fn, ms));
  }

  function respond(userText: string, forcedId?: string) {
    const nextId = (messages.at(-1)?.id ?? 0) + 1;
    const userMsg: RenoMessage = { id: nextId, from: "user", text: userText };
    setMessages((m) => [...m, userMsg]);
    setShowTopics(false);
    setBusy(true);
    onMood("sip");
    const delay = prefersReducedMotion() ? 120 : RENO_CONFIG.companion.replyDelayMs;
    later(() => {
      const forced = forcedId ? faqById(RENO_FAQ, forcedId) : undefined;
      const result = forced ? ({ kind: "answer", entry: forced, suggestions: [] } as const) : matchQuestion(userText, RENO_FAQ);
      let reply: RenoMessage;
      if (result.kind === "answer") {
        const related = (result.entry.related ?? []).filter((r) => r !== result.entry.id);
        const extra = result.suggestions.map((s) => s.id).filter((s) => !related.includes(s));
        reply = {
          id: nextId + 1,
          from: "reno",
          kind: "answer",
          faqId: result.entry.id,
          quip: result.entry.hidden ? undefined : pick(t.quips.found, nextId),
          suggestionIds: [...related, ...extra].slice(0, 3),
        };
        onMood("solving");
        later(() => onMood("hello"), 700);
        later(() => onMood("chill"), 2600);
      } else if (result.kind === "suggest") {
        reply = { id: nextId + 1, from: "reno", kind: "suggest", suggestionIds: result.suggestions.map((s) => s.id) };
        onMood("really");
        later(() => onMood("chill"), 2600);
      } else {
        reply = { id: nextId + 1, from: "reno", kind: "unknown", quip: pick(t.quips.unknown, nextId) };
        onMood("whoa");
        later(() => onMood("really"), 1400);
        later(() => onMood("chill"), 3200);
      }
      setMessages((m) => [...m, reply]);
      setBusy(false);
    }, delay);
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    const q = text.trim().slice(0, 200);
    if (!q || busy) return;
    setText("");
    respond(q);
  }

  function ask(entry: RenoFaq) {
    if (busy) return;
    respond(entry.questions[locale][0], entry.id);
  }

  function restart() {
    timers.current.forEach((h) => window.clearTimeout(h));
    setBusy(false);
    setMessages(GREETING);
    setShowTopics(true);
    onMood("hello");
    later(() => onMood("chill"), 1800);
    inputRef.current?.focus();
  }

  const href = (path: string) => `/${locale}${path === "/" ? "" : path}`;
  const actionLink = (action: RenoAction | undefined) => {
    if (!action) return null;
    if (action.type === "link") {
      return (
        <Link className="reno-action" href={href(action.href)}>
          {action.label[locale]} <span aria-hidden="true">{locale === "ar" ? "←" : "→"}</span>
        </Link>
      );
    }
    return contactAction(action.type === "whatsapp");
  };
  const contactAction = (preferWhatsApp: boolean) =>
    preferWhatsApp && whatsapp ? (
      <a className="reno-action" href={whatsapp} target="_blank" rel="noopener noreferrer">
        {t.whatsapp}
      </a>
    ) : (
      <Link className="reno-action" href={href("/contact")}>
        {t.contact}
      </Link>
    );

  const chips = (ids: string[]) => {
    const entries = ids.map((i) => faqById(RENO_FAQ, i)).filter((e): e is RenoFaq => !!e && !e.hidden);
    if (!entries.length) return null;
    return (
      <div className="reno-chips">
        {entries.map((e) => (
          <button key={e.id} type="button" className="reno-chip" onClick={() => ask(e)} disabled={busy}>
            {e.questions[locale][0]}
          </button>
        ))}
      </div>
    );
  };

  const topicEntries = RENO_FAQ.filter((f) => f.category === category && !f.hidden);

  return (
    <section id={id} className="reno-panel" role="dialog" aria-modal="false" aria-label={t.panelLabel}>
      <header>
        <div className="reno-head-avatar" aria-hidden="true">
          <RenoArt variant="avatar" mood={busy ? "sip" : "chill"} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2>{t.name}</h2>
          <p className="reno-sub">{t.subtitle}</p>
        </div>
        <button type="button" className="reno-icon-btn" onClick={restart} aria-label={t.restart} title={t.restart}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
            <path d="M3 3v5h5" />
          </svg>
        </button>
        <button type="button" className="reno-icon-btn" onClick={onClose} aria-label={t.close} title={t.close}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </header>

      <div className="reno-log" ref={logRef} aria-live="polite" aria-relevant="additions">
        {messages.map((m) => {
          if (m.from === "user") {
            return (
              <div key={m.id} className="reno-msg" data-from="user">
                <span className="sr-only">{t.you}: </span>
                {m.text}
              </div>
            );
          }
          if (m.kind === "greeting") {
            return (
              <div key={m.id} className="reno-msg" data-from="reno">
                <p>{t.greeting}</p>
              </div>
            );
          }
          if (m.kind === "answer") {
            const entry = faqById(RENO_FAQ, m.faqId);
            if (!entry) return null;
            return (
              <div key={m.id} className="reno-msg" data-from="reno" data-faq={entry.id}>
                {m.quip ? <span className="reno-quip">{m.quip}</span> : null}
                <p>{entry.answers[locale]}</p>
                {entry.action ? <div className="reno-actions">{actionLink(entry.action)}</div> : null}
                {m.suggestionIds.length ? (
                  <div style={{ marginTop: 12 }}>
                    <p className="reno-label">{t.related}</p>
                    {chips(m.suggestionIds)}
                  </div>
                ) : null}
              </div>
            );
          }
          if (m.kind === "suggest") {
            return (
              <div key={m.id} className="reno-msg" data-from="reno" data-kind="suggest">
                <p style={{ marginBottom: 10 }}>{t.didYouMean}</p>
                {chips(m.suggestionIds)}
              </div>
            );
          }
          return (
            <div key={m.id} className="reno-msg" data-from="reno" data-kind="unknown">
              {m.quip ? <span className="reno-quip">{m.quip}</span> : null}
              <p>{t.unknown}</p>
              <div className="reno-actions">{contactAction(true)}</div>
            </div>
          );
        })}

        {busy ? (
          <div className="reno-msg" data-from="reno" aria-hidden="true">
            <span className="reno-quip">{pick(t.quips.thinking, messages.length)}</span>
            <span className="reno-typing"><span /><span /><span /></span>
          </div>
        ) : null}

        {showTopics && !busy ? (
          <div>
            <p className="reno-label">{t.suggested}</p>
            <div className="reno-tabs" role="group" aria-label={t.suggested}>
              {RENO_CATEGORIES.map((c) => (
                <button key={c.id} type="button" className="reno-chip" aria-pressed={category === c.id} onClick={() => setCategory(c.id)}>
                  {c.label[locale]}
                </button>
              ))}
            </div>
            {chips(topicEntries.map((e) => e.id))}
          </div>
        ) : null}
      </div>

      <form className="reno-form" onSubmit={submit}>
        <label htmlFor={`${id}-input`} className="sr-only">
          {t.inputLabel}
        </label>
        <input
          ref={inputRef}
          id={`${id}-input`}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t.placeholder}
          maxLength={200}
          autoComplete="off"
          enterKeyHint="send"
        />
        <button type="submit" className="reno-send" disabled={!text.trim() || busy}>
          {t.send}
        </button>
      </form>
      <div className="reno-foot">
        <button type="button" onClick={() => setShowTopics((v) => !v)} aria-expanded={showTopics}>
          {t.suggested}
        </button>
        <Link href={href("/faq")}>{t.allQuestions}</Link>
      </div>
    </section>
  );
}
