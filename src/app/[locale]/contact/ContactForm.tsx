"use client";

import { useActionState, useEffect, useRef } from "react";
import type { Dictionary } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { submitLead, type ContactState } from "./actions";

type Option = { value: string; label: string };

export function ContactForm({
  t,
  locale,
  topics,
  defaultTopic,
}: {
  t: Dictionary["contact"];
  locale: "en" | "ar";
  topics: Option[];
  defaultTopic?: string;
}) {
  const [state, action, pending] = useActionState<ContactState, FormData>(submitLead, { status: "idle" });
  // Set after mount (not during render) so server and client markup match.
  const startedRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (startedRef.current) startedRef.current.value = String(Date.now());
  }, []);
  const f = state.fields ?? {};

  if (state.status === "success") {
    return (
      <div role="status" className="rounded-2xl bg-ink p-8 text-paper lg:p-10">
        <span aria-hidden className="block h-3 w-3 rotate-45 bg-signal" />
        <h3 className="mt-8 text-2xl font-medium tracking-tight">{t.successTitle}</h3>
        <p className="mt-3 text-paper/65">{t.success}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-8 text-sm font-medium text-paper underline underline-offset-4"
        >
          {t.another}
        </button>
      </div>
    );
  }

  const field = "mt-2 w-full rounded-xl border bg-white px-4 py-3 text-ink outline-none transition-colors placeholder:text-stone/70 focus:border-ink";
  const ok = "border-ink/15";
  const bad = "border-signal";

  return (
    <form action={action} noValidate className="space-y-6" aria-describedby="form-status">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="sourcePath" value={`/${locale}/contact`} />
      <input ref={startedRef} type="hidden" name="started_at" defaultValue="0" />
      <div aria-hidden className="absolute -start-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Company website
          <input type="text" name="company_website" tabIndex={-1} autoComplete="off" defaultValue="" />
        </label>
      </div>

      <div>
        <label htmlFor="c-name" className="text-sm font-medium text-ink">
          {t.fields.name}
        </label>
        <input id="c-name" name="name" required autoComplete="name" maxLength={120} className={cn(field, f.name ? bad : ok)} aria-invalid={!!f.name} />
        {f.name ? <p className="mt-1.5 text-sm text-signal-deep">{t.errors.name}</p> : null}
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="c-phone" className="text-sm font-medium text-ink">
            {t.fields.phone}
          </label>
          <input
            id="c-phone"
            name="phone"
            type="tel"
            dir="ltr"
            autoComplete="tel"
            maxLength={40}
            className={cn(field, "rtl:text-right", f.phone || f.contact ? bad : ok)}
            aria-invalid={!!(f.phone || f.contact)}
          />
          {f.phone ? <p className="mt-1.5 text-sm text-signal-deep">{t.errors.phone}</p> : null}
        </div>
        <div>
          <label htmlFor="c-email" className="text-sm font-medium text-ink">
            {t.fields.email} <span className="font-normal text-stone">({t.fields.optional})</span>
          </label>
          <input
            id="c-email"
            name="email"
            type="email"
            dir="ltr"
            autoComplete="email"
            maxLength={200}
            className={cn(field, "rtl:text-right", f.email ? bad : ok)}
            aria-invalid={!!f.email}
          />
          {f.email ? <p className="mt-1.5 text-sm text-signal-deep">{t.errors.email}</p> : null}
        </div>
      </div>
      {f.contact ? <p className="-mt-3 text-sm text-signal-deep">{t.errors.contact}</p> : null}

      <div>
        <label htmlFor="c-topic" className="text-sm font-medium text-ink">
          {t.fields.projectType}
        </label>
        <div className="relative">
        <select id="c-topic" name="projectType" defaultValue={defaultTopic ?? ""} className={cn(field, ok, "appearance-none pe-10")}>
          <option value="">{t.projectPlaceholder}</option>
          {topics.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
          <option value="other">{t.projectOther}</option>
        </select>
          <svg aria-hidden viewBox="0 0 24 24" className="pointer-events-none absolute end-4 top-1/2 mt-1 h-4 w-4 -translate-y-1/2 text-stone" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </div>

      <div>
        <label htmlFor="c-message" className="text-sm font-medium text-ink">
          {t.fields.message}
        </label>
        <textarea
          id="c-message"
          name="message"
          rows={5}
          maxLength={3000}
          placeholder={t.messagePlaceholder}
          className={cn(field, f.message ? bad : ok, "resize-y")}
        />
        {f.message ? <p className="mt-1.5 text-sm text-signal-deep">{t.errors.message}</p> : null}
      </div>

      <fieldset>
        <legend className="text-sm font-medium text-ink">{t.fields.preferred}</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {(["whatsapp", "phone", "email"] as const).map((m, i) => (
            <label key={m} className="cursor-pointer">
              <input type="radio" name="preferredContact" value={m} defaultChecked={i === 0} className="peer sr-only" />
              <span className="inline-flex rounded-full border border-ink/15 px-4 py-2 text-sm text-graphite transition-colors peer-checked:border-ink peer-checked:bg-ink peer-checked:text-paper peer-focus-visible:outline-2 peer-focus-visible:outline-signal">
                {t.methods[m]}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div id="form-status" aria-live="polite">
        {state.status === "error" && state.error ? (
          <p className="rounded-xl bg-signal/10 px-4 py-3 text-sm text-signal-deep">{t.errors[state.error]}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-13 items-center justify-center rounded-full bg-ink px-8 font-medium text-paper transition-colors hover:bg-ink-3 disabled:opacity-60"
        >
          {pending ? t.sending : t.submit}
        </button>
        <p className="text-xs text-stone">{t.privacy}</p>
      </div>
    </form>
  );
}
