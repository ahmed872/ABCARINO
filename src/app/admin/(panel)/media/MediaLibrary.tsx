"use client";

/* eslint-disable @next/next/no-img-element -- admin previews of local optimised media */
import { useRouter } from "next/navigation";
import { useActionState, useState, useTransition } from "react";
import { MediaUploader } from "@/components/admin/MediaField";
import type { FormState } from "@/lib/admin/form-state";

type Item = {
  id: string;
  url: string;
  width: number;
  height: number;
  sizeBytes: number;
  originalName: string;
  altEn: string;
  altAr: string;
  isInspiration: boolean;
  createdAt: string;
};

function Editor({
  item,
  onClose,
  update,
  remove,
}: {
  item: Item;
  onClose: () => void;
  update: (id: string, s: FormState, fd: FormData) => Promise<FormState>;
  remove: (id: string) => Promise<{ ok: boolean; message?: string }>;
}) {
  const [state, action, pending] = useActionState(update.bind(null, item.id), { ok: false });
  const [deleting, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-ink/60 sm:items-center sm:p-6" role="dialog" aria-modal="true">
      <div className="grid max-h-[92dvh] w-full max-w-4xl overflow-y-auto rounded-t-2xl bg-paper sm:rounded-2xl md:grid-cols-2">
        <div className="flex items-center justify-center bg-ink p-4">
          <img src={item.url} alt={item.altEn} className="max-h-[60dvh] w-auto object-contain" />
        </div>
        <form action={action} className="space-y-4 p-6">
          <div>
            <p className="truncate font-medium">{item.originalName || "Untitled"}</p>
            <p className="text-xs text-stone">
              {item.width}×{item.height} · {(item.sizeBytes / 1024).toFixed(0)} KB · WebP
            </p>
            <input readOnly value={item.url} className="admin-input mt-2 font-mono text-xs" onFocus={(e) => e.currentTarget.select()} aria-label="Public URL" />
          </div>
          <div>
            <label className="admin-label" htmlFor="altEn">
              Alt text — English
            </label>
            <input id="altEn" name="altEn" defaultValue={item.altEn} className="admin-input" maxLength={200} />
          </div>
          <div>
            <label className="admin-label" htmlFor="altAr">
              Alt text — العربية
            </label>
            <input id="altAr" name="altAr" dir="rtl" defaultValue={item.altAr} className="admin-input" maxLength={200} />
          </div>
          <label className="flex items-start gap-3">
            <input type="checkbox" name="isInspiration" defaultChecked={item.isInspiration} className="mt-0.5 h-4 w-4 accent-[#0e0f11]" />
            <span className="text-sm">
              <span className="font-medium">Inspiration / stock image</span>
              <span className="block text-xs text-stone">Shows an “Inspiration” label so it is never mistaken for ABCARINO’s own completed work.</span>
            </span>
          </label>
          {state.message ? <p className="text-sm text-ok">{state.message}</p> : null}
          {error ? <p className="text-sm text-signal-deep">{error}</p> : null}
          <div className="flex items-center justify-between gap-2 pt-2">
            <button
              type="button"
              disabled={deleting}
              onClick={() => {
                if (!window.confirm("Delete this image permanently?")) return;
                start(async () => {
                  const res = await remove(item.id);
                  if (res.ok) onClose();
                  else setError(res.message ?? "Could not delete this image.");
                });
              }}
              className="rounded-lg px-3 py-2 text-sm text-signal-deep hover:bg-signal/10"
            >
              {deleting ? "Deleting…" : "Delete"}
            </button>
            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="rounded-lg border border-ink/15 bg-white px-4 py-2 text-sm">
                Close
              </button>
              <button type="submit" disabled={pending} className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-paper disabled:opacity-60">
                {pending ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export function MediaLibrary({
  items,
  update,
  remove,
}: {
  items: Item[];
  update: (id: string, s: FormState, fd: FormData) => Promise<FormState>;
  remove: (id: string) => Promise<{ ok: boolean; message?: string }>;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<Item | null>(null);
  return (
    <>
      <MediaUploader onUploaded={() => router.refresh()} />
      {items.length ? (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {items.map((m) => (
            <button key={m.id} type="button" onClick={() => setEditing(m)} className="group overflow-hidden rounded-xl bg-white text-start ring-1 ring-ink/10 hover:ring-ink/40">
              <div className="relative aspect-[4/3] bg-ink/5">
                <img src={m.url} alt={m.altEn} className="h-full w-full object-cover" loading="lazy" />
                {m.isInspiration ? <span className="absolute start-2 top-2 rounded-full bg-ink/70 px-2 py-0.5 text-[0.6rem] text-paper">Inspiration</span> : null}
                {!m.altEn ? <span className="absolute end-2 top-2 rounded-full bg-glow px-2 py-0.5 text-[0.6rem] text-ink">No alt</span> : null}
              </div>
              <p className="truncate px-2.5 py-2 text-xs text-graphite">{m.originalName || "Untitled"}</p>
            </button>
          ))}
        </div>
      ) : (
        <p className="mt-6 text-sm text-stone">No images yet.</p>
      )}
      {editing ? (
        <Editor
          item={editing}
          update={update}
          remove={remove}
          onClose={() => {
            setEditing(null);
            router.refresh();
          }}
        />
      ) : null}
    </>
  );
}
