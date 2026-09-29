"use client";

import { createContext, useActionState, useContext, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import type { FormState } from "@/lib/admin/form-state";
import { cn, slugify } from "@/lib/utils";

/* ─────────────────────────────────────────── form shell */

const ErrorsContext = createContext<Record<string, string>>({});
const useFieldError = (name: string) => useContext(ErrorsContext)[name];

export function EntityForm({
  action,
  children,
  submitLabel = "Save changes",
  footer,
  className,
}: {
  action: (state: FormState, fd: FormData) => Promise<FormState>;
  children: ReactNode;
  submitLabel?: string;
  footer?: ReactNode;
  className?: string;
}) {
  const [state, formAction] = useActionState(action, { ok: false });
  const [dirty, setDirty] = useState(false);
  const errors = state.errors ?? {};
  const errorCount = Object.keys(errors).length;

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  return (
    <ErrorsContext.Provider value={errors}>
      <form
        action={(fd) => {
          setDirty(false);
          return formAction(fd);
        }}
        onChange={() => setDirty(true)}
        className={cn("space-y-6", className)}
        noValidate
      >
        {state.message || errorCount ? (
          <div
            role={state.ok ? "status" : "alert"}
            className={cn(
              "rounded-xl px-4 py-3 text-sm",
              state.ok ? "bg-ok/10 text-ok" : "bg-signal/10 text-signal-deep",
            )}
          >
            {state.message ?? "Please fix the highlighted fields."}
            {!state.ok && errorCount ? (
              <ul className="mt-1 list-disc ps-5 text-xs">
                {Object.entries(errors).map(([k, v]) => (
                  <li key={k}>
                    <span className="font-medium">{k}</span>: {v}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
        {children}
        <div className="sticky bottom-0 z-10 -mx-4 flex items-center justify-between gap-4 border-t border-ink/10 bg-paper/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-xl sm:border">
          <div className="text-xs text-stone">{dirty ? "Unsaved changes" : footer}</div>
          <SubmitButton label={submitLabel} />
        </div>
      </form>
    </ErrorsContext.Provider>
  );
}

export function SubmitButton({ label, variant = "ink" }: { label: string; variant?: "ink" | "danger" | "ghost" }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-lg px-5 text-sm font-medium transition-colors disabled:opacity-60",
        variant === "ink" && "bg-ink text-paper hover:bg-ink-3",
        variant === "danger" && "bg-signal-deep text-white hover:bg-signal",
        variant === "ghost" && "border border-ink/15 bg-white text-ink hover:border-ink",
      )}
    >
      {pending ? "Saving…" : label}
    </button>
  );
}

export function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="admin-card p-5 sm:p-6">
      <div className="mb-5">
        <h2 className="text-base font-semibold">{title}</h2>
        {description ? <p className="mt-0.5 text-sm text-stone">{description}</p> : null}
      </div>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

function FieldError({ name }: { name: string }) {
  const error = useFieldError(name);
  return error ? <p className="mt-1 text-xs text-signal-deep">{error}</p> : null;
}

function Hint({ children }: { children?: ReactNode }) {
  return children ? <p className="mt-1 text-xs text-stone">{children}</p> : null;
}

/* ─────────────────────────────────────────── primitive fields */

export function TextField({
  name,
  label,
  defaultValue,
  hint,
  dir,
  type = "text",
  multiline,
  rows = 4,
  required,
  placeholder,
  maxLength,
}: {
  name: string;
  label: string;
  defaultValue?: string | number | null;
  hint?: ReactNode;
  dir?: "rtl" | "ltr";
  type?: string;
  multiline?: boolean;
  rows?: number;
  required?: boolean;
  placeholder?: string;
  maxLength?: number;
}) {
  const id = useId();
  const err = useFieldError(name);
  const cls = cn("admin-input", err && "!border-signal");
  return (
    <div>
      <label htmlFor={id} className="admin-label">
        {label}
        {required ? <span className="text-signal"> *</span> : null}
      </label>
      {multiline ? (
        <textarea id={id} name={name} rows={rows} dir={dir} defaultValue={defaultValue ?? ""} className={cls} placeholder={placeholder} maxLength={maxLength} aria-invalid={!!err} />
      ) : (
        <input id={id} name={name} type={type} dir={dir} defaultValue={defaultValue ?? ""} className={cls} placeholder={placeholder} maxLength={maxLength} aria-invalid={!!err} />
      )}
      <FieldError name={name} />
      <Hint>{hint}</Hint>
    </div>
  );
}

/** English + Arabic inputs side by side; Arabic is RTL with the Arabic font. */
export function BilingualField({
  base,
  label,
  en,
  ar,
  multiline,
  rows,
  hint,
  required,
  maxLength,
}: {
  base: string;
  label: string;
  en?: string | null;
  ar?: string | null;
  multiline?: boolean;
  rows?: number;
  hint?: ReactNode;
  required?: boolean;
  maxLength?: number;
}) {
  return (
    <div>
      <div className="grid gap-4 md:grid-cols-2">
        <TextField name={`${base}En`} label={`${label} — English`} defaultValue={en} multiline={multiline} rows={rows} required={required} maxLength={maxLength} dir="ltr" />
        <TextField name={`${base}Ar`} label={`${label} — العربية`} defaultValue={ar} multiline={multiline} rows={rows} required={required} maxLength={maxLength} dir="rtl" />
      </div>
      <Hint>{hint}</Hint>
    </div>
  );
}

export function SelectField({
  name,
  label,
  options,
  defaultValue,
  hint,
}: {
  name: string;
  label: string;
  options: Array<{ value: string; label: string }>;
  defaultValue?: string | null;
  hint?: ReactNode;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="admin-label">
        {label}
      </label>
      <select id={id} name={name} defaultValue={defaultValue ?? ""} className="admin-input">
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <FieldError name={name} />
      <Hint>{hint}</Hint>
    </div>
  );
}

export function CheckboxField({ name, label, defaultChecked, hint }: { name: string; label: string; defaultChecked?: boolean; hint?: ReactNode }) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="mt-0.5 h-4 w-4 accent-[#0e0f11]" />
      <span>
        <span className="block text-sm font-medium">{label}</span>
        {hint ? <span className="block text-xs text-stone">{hint}</span> : null}
      </span>
    </label>
  );
}

/** Radio "segmented" control — used for status so the choice is always visible. */
export function SegmentedField({
  name,
  label,
  options,
  defaultValue,
  hint,
}: {
  name: string;
  label: string;
  options: Array<{ value: string; label: string; hint?: string }>;
  defaultValue: string;
  hint?: ReactNode;
}) {
  return (
    <fieldset>
      <legend className="admin-label">{label}</legend>
      <div className={cn("grid gap-2", options.length === 2 ? "sm:grid-cols-2" : options.length === 4 ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-3")}>
        {options.map((o) => (
          <label key={o.value} className="cursor-pointer">
            <input type="radio" name={name} value={o.value} defaultChecked={defaultValue === o.value} className="peer sr-only" />
            <span className="block rounded-lg border border-ink/15 bg-white px-3 py-2.5 text-sm transition-colors peer-checked:border-ink peer-checked:bg-ink peer-checked:text-paper peer-focus-visible:ring-2 peer-focus-visible:ring-signal">
              <span className="font-medium">{o.label}</span>
              {o.hint ? <span className="block text-xs opacity-60">{o.hint}</span> : null}
            </span>
          </label>
        ))}
      </div>
      <FieldError name={name} />
      <Hint>{hint}</Hint>
    </fieldset>
  );
}

/** Slug input with a one-click generator from the English title/name field. */
export function SlugField({ defaultValue, sourceField, prefix }: { defaultValue?: string; sourceField: string; prefix: string }) {
  const ref = useRef<HTMLInputElement>(null);
  const id = useId();
  const err = useFieldError("slug");
  return (
    <div>
      <label htmlFor={id} className="admin-label">
        URL slug <span className="text-signal">*</span>
      </label>
      <div className="flex gap-2">
        <div className="flex flex-1 items-center rounded-lg border border-[#d6d2c8] bg-white ps-3 text-sm text-stone focus-within:border-ink">
          <span className="shrink-0">{prefix}</span>
          <input
            ref={ref}
            id={id}
            name="slug"
            defaultValue={defaultValue ?? ""}
            className="w-full bg-transparent px-1 py-2 text-ink outline-none"
            dir="ltr"
            aria-invalid={!!err}
          />
        </div>
        <button
          type="button"
          className="rounded-lg border border-ink/15 bg-white px-3 text-xs font-medium hover:border-ink"
          onClick={(e) => {
            const form = e.currentTarget.form;
            const source = form?.elements.namedItem(sourceField) as HTMLInputElement | null;
            if (ref.current && source?.value) ref.current.value = slugify(source.value);
          }}
        >
          Generate
        </button>
      </div>
      <FieldError name="slug" />
      <Hint>Lowercase letters, numbers and hyphens. Changing it changes the page address.</Hint>
    </div>
  );
}

/* ─────────────────────────────────────────── list editors */

type LText = { en: string; ar: string };

function move<T>(arr: T[], from: number, to: number): T[] {
  if (to < 0 || to >= arr.length) return arr;
  const copy = [...arr];
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
}

function RowControls({ index, count, onMove, onRemove }: { index: number; count: number; onMove: (to: number) => void; onRemove: () => void }) {
  const btn = "h-8 w-8 rounded-md border border-ink/10 bg-white text-xs text-graphite hover:border-ink disabled:opacity-30";
  return (
    <div className="flex shrink-0 gap-1">
      <button type="button" className={btn} onClick={() => onMove(index - 1)} disabled={index === 0} aria-label="Move up">
        ↑
      </button>
      <button type="button" className={btn} onClick={() => onMove(index + 1)} disabled={index === count - 1} aria-label="Move down">
        ↓
      </button>
      <button type="button" className={cn(btn, "hover:border-signal hover:text-signal")} onClick={onRemove} aria-label="Remove">
        ✕
      </button>
    </div>
  );
}

/** Ordered list of bilingual one-liners (features, included items…). */
export function LocalizedListField({ name, label, defaultValue, hint }: { name: string; label: string; defaultValue: LText[]; hint?: ReactNode }) {
  const [items, setItems] = useState<LText[]>(defaultValue);
  const update = (i: number, key: keyof LText, value: string) => setItems((prev) => prev.map((it, j) => (j === i ? { ...it, [key]: value } : it)));
  return (
    <div>
      <p className="admin-label">{label}</p>
      <input type="hidden" name={name} value={JSON.stringify(items)} />
      <div className="space-y-2">
        {items.map((it, i) => (
          <div key={i} className="flex flex-col gap-2 rounded-lg bg-paper-2/60 p-2 sm:flex-row sm:items-center">
            <input className="admin-input" dir="ltr" placeholder="English" value={it.en} onChange={(e) => update(i, "en", e.target.value)} maxLength={300} />
            <input className="admin-input" dir="rtl" placeholder="العربية" value={it.ar} onChange={(e) => update(i, "ar", e.target.value)} maxLength={300} />
            <RowControls index={i} count={items.length} onMove={(to) => setItems((p) => move(p, i, to))} onRemove={() => setItems((p) => p.filter((_, j) => j !== i))} />
          </div>
        ))}
      </div>
      <button type="button" onClick={() => setItems((p) => [...p, { en: "", ar: "" }])} className="mt-2 text-sm font-medium text-ink underline underline-offset-4">
        + Add item
      </button>
      <FieldError name={name} />
      <Hint>{hint}</Hint>
    </div>
  );
}

type Block = { titleEn: string; titleAr: string; textEn: string; textAr: string };

/** Ordered list of bilingual title + text blocks (benefits). */
export function BlockListField({ name, label, defaultValue, hint }: { name: string; label: string; defaultValue: Block[]; hint?: ReactNode }) {
  const [items, setItems] = useState<Block[]>(defaultValue);
  const update = (i: number, key: keyof Block, value: string) => setItems((prev) => prev.map((it, j) => (j === i ? { ...it, [key]: value } : it)));
  return (
    <div>
      <p className="admin-label">{label}</p>
      <input type="hidden" name={name} value={JSON.stringify(items)} />
      <div className="space-y-3">
        {items.map((it, i) => (
          <div key={i} className="rounded-lg bg-paper-2/60 p-3">
            <div className="flex items-center justify-between pb-2">
              <span className="text-xs font-medium text-stone">#{i + 1}</span>
              <RowControls index={i} count={items.length} onMove={(to) => setItems((p) => move(p, i, to))} onRemove={() => setItems((p) => p.filter((_, j) => j !== i))} />
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              <input className="admin-input" dir="ltr" placeholder="Title (English)" value={it.titleEn} onChange={(e) => update(i, "titleEn", e.target.value)} maxLength={120} />
              <input className="admin-input" dir="rtl" placeholder="العنوان (العربية)" value={it.titleAr} onChange={(e) => update(i, "titleAr", e.target.value)} maxLength={120} />
              <textarea className="admin-input" dir="ltr" rows={2} placeholder="Text (English)" value={it.textEn} onChange={(e) => update(i, "textEn", e.target.value)} maxLength={600} />
              <textarea className="admin-input" dir="rtl" rows={2} placeholder="النص (العربية)" value={it.textAr} onChange={(e) => update(i, "textAr", e.target.value)} maxLength={600} />
            </div>
          </div>
        ))}
      </div>
      <button type="button" onClick={() => setItems((p) => [...p, { titleEn: "", titleAr: "", textEn: "", textAr: "" }])} className="mt-2 text-sm font-medium text-ink underline underline-offset-4">
        + Add block
      </button>
      <FieldError name={name} />
      <Hint>{hint}</Hint>
    </div>
  );
}

/** Multiple checkboxes submitted under the same name. */
export function MultiCheckField({
  name,
  label,
  options,
  defaultValues,
  hint,
}: {
  name: string;
  label: string;
  options: Array<{ value: string; label: string; note?: string }>;
  defaultValues: string[];
  hint?: ReactNode;
}) {
  return (
    <fieldset>
      <legend className="admin-label">{label}</legend>
      {options.length ? (
        <div className="grid max-h-64 gap-1 overflow-y-auto rounded-lg border border-ink/10 bg-white p-2 sm:grid-cols-2">
          {options.map((o) => (
            <label key={o.value} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-paper-2">
              <input type="checkbox" name={name} value={o.value} defaultChecked={defaultValues.includes(o.value)} className="h-4 w-4 accent-[#0e0f11]" />
              <span className="flex-1">{o.label}</span>
              {o.note ? <span className="text-xs text-stone">{o.note}</span> : null}
            </label>
          ))}
        </div>
      ) : (
        <p className="text-sm text-stone">Nothing to link yet.</p>
      )}
      <Hint>{hint}</Hint>
    </fieldset>
  );
}
