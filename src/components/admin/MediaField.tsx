"use client";

/* eslint-disable @next/next/no-img-element -- admin thumbnails of already-optimised local media */
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export type MediaItem = { id: string; url: string; width: number; height: number; altEn: string; originalName?: string };

async function uploadFile(file: File): Promise<MediaItem> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/admin/media", { method: "POST", body: fd, credentials: "same-origin" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Upload failed");
  return data.item as MediaItem;
}

export function MediaUploader({ onUploaded, multiple = true, compact }: { onUploaded: (items: MediaItem[]) => void; multiple?: boolean; compact?: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const handle = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    setError(null);
    const done: MediaItem[] = [];
    for (const f of Array.from(files)) {
      try {
        done.push(await uploadFile(f));
      } catch (e) {
        setError(`${f.name}: ${(e as Error).message}`);
      }
    }
    setBusy(false);
    if (input.current) input.current.value = "";
    if (done.length) onUploaded(done);
  };

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          void handle(e.dataTransfer.files);
        }}
        className={cn(
          "flex flex-col items-center justify-center rounded-xl border border-dashed text-center transition-colors",
          compact ? "p-4" : "p-8",
          drag ? "border-ink bg-white" : "border-ink/20 bg-white/60",
        )}
      >
        <p className="text-sm font-medium">{busy ? "Uploading & optimising…" : "Drop images here"}</p>
        <p className="mt-1 text-xs text-stone">JPEG, PNG, WebP or AVIF · up to 15 MB · metadata is stripped automatically</p>
        <button type="button" disabled={busy} onClick={() => input.current?.click()} className="mt-3 rounded-lg bg-ink px-4 py-2 text-xs font-medium text-paper disabled:opacity-60">
          Choose files
        </button>
        <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,image/avif,image/gif" multiple={multiple} hidden onChange={(e) => void handle(e.target.files)} />
      </div>
      {error ? <p className="mt-2 text-xs text-signal-deep">{error}</p> : null}
    </div>
  );
}

function PickerModal({ onClose, onPick, multiple }: { onClose: () => void; onPick: (items: MediaItem[]) => void; multiple: boolean }) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<MediaItem[]>([]);

  const load = useCallback(async (query: string) => {
    setLoading(true);
    const res = await fetch(`/api/admin/media?q=${encodeURIComponent(query)}`, { credentials: "same-origin" });
    const data = await res.json().catch(() => ({ items: [] }));
    setItems(data.items ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    const id = setTimeout(() => void load(q), 200);
    return () => clearTimeout(id);
  }, [q, load]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const toggle = (m: MediaItem) => {
    if (!multiple) {
      onPick([m]);
      return;
    }
    setSelected((s) => (s.some((x) => x.id === m.id) ? s.filter((x) => x.id !== m.id) : [...s, m]));
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-ink/60 p-0 sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label="Media library">
      <div className="flex max-h-[90dvh] w-full max-w-4xl flex-col overflow-hidden rounded-t-2xl bg-paper sm:rounded-2xl">
        <div className="flex items-center gap-3 border-b border-ink/10 p-4">
          <input className="admin-input" placeholder="Search by file name or alt text…" value={q} onChange={(e) => setQ(e.target.value)} />
          <button type="button" onClick={onClose} className="rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm">
            Close
          </button>
        </div>
        <div className="overflow-y-auto p-4">
          <MediaUploader compact onUploaded={(up) => setItems((prev) => [...up, ...prev])} />
          {loading ? <p className="mt-6 text-sm text-stone">Loading…</p> : null}
          {!loading && !items.length ? <p className="mt-6 text-sm text-stone">No images yet — upload one above.</p> : null}
          <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {items.map((m) => {
              const on = selected.some((x) => x.id === m.id);
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => toggle(m)}
                  className={cn("group relative aspect-square overflow-hidden rounded-lg bg-ink/5 ring-2", on ? "ring-signal" : "ring-transparent hover:ring-ink/30")}
                  title={m.originalName || m.altEn}
                >
                  <img src={m.url} alt={m.altEn} className="h-full w-full object-cover" loading="lazy" />
                  {on ? <span className="absolute end-1.5 top-1.5 rounded-full bg-signal px-1.5 text-[0.65rem] font-bold text-white">{selected.findIndex((x) => x.id === m.id) + 1}</span> : null}
                </button>
              );
            })}
          </div>
        </div>
        {multiple ? (
          <div className="flex items-center justify-between border-t border-ink/10 p-4">
            <span className="text-sm text-stone">{selected.length} selected</span>
            <button type="button" disabled={!selected.length} onClick={() => onPick(selected)} className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-paper disabled:opacity-40">
              Add selected
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

/** Single image selector storing the media id in a hidden input. */
export function MediaField({ name, label, defaultValue, hint }: { name: string; label: string; defaultValue: MediaItem | null; hint?: string }) {
  const [value, setValue] = useState<MediaItem | null>(defaultValue);
  const [open, setOpen] = useState(false);
  return (
    <div>
      <p className="admin-label">{label}</p>
      <input type="hidden" name={name} value={value?.id ?? ""} />
      <div className="flex items-center gap-4">
        <div className="relative flex h-24 w-32 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-ink/5 ring-1 ring-ink/10">
          {value ? <img src={value.url} alt={value.altEn} className="h-full w-full object-cover" /> : <span className="px-2 text-center text-[0.7rem] text-stone">Concept illustration used</span>}
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setOpen(true)} className="rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm font-medium hover:border-ink">
            {value ? "Replace" : "Choose image"}
          </button>
          {value ? (
            <button type="button" onClick={() => setValue(null)} className="rounded-lg px-3 py-2 text-sm text-signal-deep hover:bg-signal/10">
              Remove
            </button>
          ) : null}
        </div>
      </div>
      {hint ? <p className="mt-1 text-xs text-stone">{hint}</p> : null}
      {open ? (
        <PickerModal
          multiple={false}
          onClose={() => setOpen(false)}
          onPick={(items) => {
            setValue(items[0] ?? null);
            setOpen(false);
          }}
        />
      ) : null}
    </div>
  );
}

/** Ordered gallery; each id is submitted under the same field name. */
export function GalleryField({ name, label, defaultValue, hint }: { name: string; label: string; defaultValue: MediaItem[]; hint?: string }) {
  const [items, setItems] = useState<MediaItem[]>(defaultValue);
  const [open, setOpen] = useState(false);
  return (
    <div>
      <p className="admin-label">{label}</p>
      {items.map((m) => (
        <input key={m.id} type="hidden" name={name} value={m.id} />
      ))}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        {items.map((m, i) => (
          <div key={m.id} className="group relative aspect-[4/3] overflow-hidden rounded-lg bg-ink/5 ring-1 ring-ink/10">
            <img src={m.url} alt={m.altEn} className="h-full w-full object-cover" />
            <div className="absolute inset-x-1 bottom-1 flex justify-between opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
              <button type="button" aria-label="Move earlier" disabled={i === 0} onClick={() => setItems((p) => { const c = [...p]; [c[i - 1], c[i]] = [c[i], c[i - 1]]; return c; })} className="rounded bg-white/90 px-1.5 text-xs disabled:opacity-30">
                ←
              </button>
              <button type="button" aria-label="Remove" onClick={() => setItems((p) => p.filter((x) => x.id !== m.id))} className="rounded bg-white/90 px-1.5 text-xs text-signal-deep">
                ✕
              </button>
              <button type="button" aria-label="Move later" disabled={i === items.length - 1} onClick={() => setItems((p) => { const c = [...p]; [c[i + 1], c[i]] = [c[i], c[i + 1]]; return c; })} className="rounded bg-white/90 px-1.5 text-xs disabled:opacity-30">
                →
              </button>
            </div>
          </div>
        ))}
        <button type="button" onClick={() => setOpen(true)} className="flex aspect-[4/3] items-center justify-center rounded-lg border border-dashed border-ink/25 text-sm text-stone hover:border-ink hover:text-ink">
          + Add
        </button>
      </div>
      {hint ? <p className="mt-1 text-xs text-stone">{hint}</p> : null}
      {open ? (
        <PickerModal
          multiple
          onClose={() => setOpen(false)}
          onPick={(picked) => {
            setItems((p) => [...p, ...picked.filter((x) => !p.some((y) => y.id === x.id))]);
            setOpen(false);
          }}
        />
      ) : null}
    </div>
  );
}
