"use client";

import { useTransition } from "react";

/** Small inline controls for list rows: reorder, quick status change, delete. */
export function MoveButtons({ id, onMove }: { id: string; onMove: (id: string, dir: "up" | "down") => Promise<void> }) {
  const [pending, start] = useTransition();
  const btn = "h-7 w-7 rounded-md border border-ink/10 bg-white text-xs hover:border-ink disabled:opacity-40";
  return (
    <div className="flex gap-1">
      <button type="button" className={btn} disabled={pending} onClick={() => start(() => onMove(id, "up"))} aria-label="Move up">
        ↑
      </button>
      <button type="button" className={btn} disabled={pending} onClick={() => start(() => onMove(id, "down"))} aria-label="Move down">
        ↓
      </button>
    </div>
  );
}

export function StatusSelect({
  id,
  value,
  options,
  onChange,
}: {
  id: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (id: string, value: string) => Promise<void>;
}) {
  const [pending, start] = useTransition();
  return (
    <select
      aria-label="Status"
      defaultValue={value}
      disabled={pending}
      onChange={(e) => {
        const v = e.target.value;
        start(() => onChange(id, v));
      }}
      className="rounded-md border border-ink/10 bg-white px-2 py-1 text-xs disabled:opacity-50"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function DeleteButton({
  id,
  label = "Delete",
  confirmText,
  onDelete,
}: {
  id: string;
  label?: string;
  confirmText: string;
  onDelete: (id: string) => Promise<void>;
}) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (window.confirm(confirmText)) start(() => onDelete(id));
      }}
      className="rounded-md px-2 py-1 text-xs font-medium text-signal-deep hover:bg-signal/10 disabled:opacity-50"
    >
      {pending ? "…" : label}
    </button>
  );
}
