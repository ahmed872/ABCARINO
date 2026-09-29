import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;
const base = { fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round" } as const;

/** Direction-aware arrow: mirrors automatically in RTL. */
export function ArrowIcon({ className = "", ...p }: P) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={`rtl:-scale-x-100 ${className}`} {...base} {...p}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}
export function ArrowUpRightIcon(p: P) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden {...base} {...p}>
      <path d="M7 17L17 7M9 7h8v8" />
    </svg>
  );
}
export function WhatsAppIcon(p: P) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden fill="currentColor" {...p}>
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 004.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0012.04 2zm0 18.15h-.01a8.2 8.2 0 01-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 01-1.26-4.38c0-4.54 3.7-8.23 8.25-8.23 2.2 0 4.27.86 5.83 2.42a8.18 8.18 0 012.41 5.83c0 4.54-3.7 8.22-8.24 8.22zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48a.92.92 0 00-.66.31c-.23.25-.87.85-.87 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.24 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.14-1.18-.06-.1-.22-.16-.47-.28z" />
    </svg>
  );
}
export function MailIcon(p: P) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden {...base} {...p}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </svg>
  );
}
export function PhoneIcon(p: P) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden {...base} {...p}>
      <path d="M5 4h3l2 5-2.5 1.5a11 11 0 005 5L14 13l5 2v3a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z" />
    </svg>
  );
}
export function PinIcon(p: P) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden {...base} {...p}>
      <path d="M12 21s-7-6.2-7-11.5A7 7 0 0112 2.5a7 7 0 017 7C19 14.8 12 21 12 21z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </svg>
  );
}
export function ClockIcon(p: P) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden {...base} {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}
export function MenuIcon(p: P) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden {...base} {...p}>
      <path d="M4 8h16M4 16h16" />
    </svg>
  );
}
export function CloseIcon(p: P) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden {...base} {...p}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}
export function CheckIcon(p: P) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden {...base} {...p}>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}
export function PlusIcon(p: P) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden {...base} {...p}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
