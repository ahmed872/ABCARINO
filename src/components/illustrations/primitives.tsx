import type { ReactNode } from "react";

/**
 * Drawing primitives for ABCARINO concept illustrations.
 * Language: night-time architectural drawings — fine structure lines, warm light
 * pools for comfort, and signal-orange nodes/links for intelligence & integration.
 */
export const C = {
  line: "#f4f2ed",
  glow: "#ffc98a",
  warm: "#ffb46b",
  signal: "#ff5b1f",
  cool: "#dfe6ee",
  mist: "#a3a7ad",
};

export const W = 1200;
export const H = 900;

export function Defs({ uid }: { uid: string }) {
  return (
    <defs>
      <linearGradient id={`${uid}-bg`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#181a1e" />
        <stop offset="1" stopColor="#0d0e10" />
      </linearGradient>
      <radialGradient id={`${uid}-glow`}>
        <stop offset="0" stopColor={C.glow} stopOpacity="0.62" />
        <stop offset="0.4" stopColor={C.warm} stopOpacity="0.2" />
        <stop offset="1" stopColor={C.warm} stopOpacity="0" />
      </radialGradient>
      <radialGradient id={`${uid}-glow-soft`}>
        <stop offset="0" stopColor={C.glow} stopOpacity="0.28" />
        <stop offset="1" stopColor={C.warm} stopOpacity="0" />
      </radialGradient>
      <radialGradient id={`${uid}-glow-signal`}>
        <stop offset="0" stopColor={C.signal} stopOpacity="0.5" />
        <stop offset="0.5" stopColor={C.signal} stopOpacity="0.12" />
        <stop offset="1" stopColor={C.signal} stopOpacity="0" />
      </radialGradient>
      <radialGradient id={`${uid}-glow-cool`}>
        <stop offset="0" stopColor={C.cool} stopOpacity="0.2" />
        <stop offset="1" stopColor={C.cool} stopOpacity="0" />
      </radialGradient>
      <linearGradient id={`${uid}-cone`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={C.glow} stopOpacity="0.42" />
        <stop offset="1" stopColor={C.glow} stopOpacity="0" />
      </linearGradient>
      <linearGradient id={`${uid}-beam`} x1="1" y1="0" x2="0" y2="0">
        <stop offset="0" stopColor={C.cool} stopOpacity="0.02" />
        <stop offset="1" stopColor={C.cool} stopOpacity="0.2" />
      </linearGradient>
      <linearGradient id={`${uid}-screen`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={C.cool} stopOpacity="0.42" />
        <stop offset="1" stopColor={C.cool} stopOpacity="0.12" />
      </linearGradient>
      <radialGradient id={`${uid}-vignette`} cx="0.5" cy="0.45" r="0.75">
        <stop offset="0.6" stopColor="#0d0e10" stopOpacity="0" />
        <stop offset="1" stopColor="#0d0e10" stopOpacity="0.75" />
      </radialGradient>
      <pattern id={`${uid}-grid`} width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M40 0H0V40" fill="none" stroke={C.line} strokeOpacity="0.035" strokeWidth="1" />
      </pattern>
    </defs>
  );
}

export function Frame({
  uid,
  children,
  label,
  className,
  title,
}: {
  uid: string;
  children: ReactNode;
  label?: string;
  className?: string;
  title: string;
}) {
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid slice"
      className={className}
      role="img"
      aria-label={title}
      xmlns="http://www.w3.org/2000/svg"
    >
      <Defs uid={uid} />
      <rect width={W} height={H} fill={`url(#${uid}-bg)`} />
      <rect width={W} height={H} fill={`url(#${uid}-grid)`} />
      {children}
      <rect width={W} height={H} fill={`url(#${uid}-vignette)`} pointerEvents="none" />
      {label ? <Label x={60} y={H - 52} text={label} opacity={0.55} /> : null}
    </svg>
  );
}

export function Label({
  x,
  y,
  text,
  opacity = 0.5,
  anchor = "start",
  size = 15,
  color = C.mist,
}: {
  x: number;
  y: number;
  text: string;
  opacity?: number;
  anchor?: "start" | "middle" | "end";
  size?: number;
  color?: string;
}) {
  return (
    <text
      x={x}
      y={y}
      className="mono"
      fontSize={size}
      letterSpacing="0.12em"
      fill={color}
      fillOpacity={opacity}
      textAnchor={anchor}
      direction="ltr"
    >
      {text}
    </text>
  );
}

/** Structure line (walls, slabs). */
export function S({ d, o = 0.34, w = 1.5 }: { d: string; o?: number; w?: number }) {
  return <path d={d} fill="none" stroke={C.line} strokeOpacity={o} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />;
}

/** Detail line (furniture, fixtures). */
export function Dt({ d, o = 0.18, w = 1.2 }: { d: string; o?: number; w?: number }) {
  return <path d={d} fill="none" stroke={C.line} strokeOpacity={o} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />;
}

export function Node({ x, y, r = 6, pulse = false }: { x: number; y: number; r?: number; pulse?: boolean }) {
  return (
    <g>
      {pulse ? <circle cx={x} cy={y} r={r * 3.2} fill="none" stroke={C.signal} strokeOpacity="0.3" /> : null}
      <path d={`M${x} ${y - r}L${x + r} ${y}L${x} ${y + r}L${x - r} ${y}Z`} fill={C.signal} />
    </g>
  );
}

/** Dashed integration link between nodes. */
export function Link({ d, o = 0.55 }: { d: string; o?: number }) {
  return <path d={d} fill="none" stroke={C.signal} strokeOpacity={o} strokeWidth="1.3" strokeDasharray="2 7" strokeLinecap="round" />;
}

/** Pendant fixture with light cone and floor glow. */
export function Pendant({
  uid,
  x,
  ceiling,
  drop,
  floor,
  spread = 90,
  shade = 22,
  className,
}: {
  uid: string;
  x: number;
  ceiling: number;
  drop: number;
  floor: number;
  spread?: number;
  shade?: number;
  className?: string;
}) {
  const y = ceiling + drop;
  return (
    <g className={className}>
      <path
        d={`M${x - shade * 0.55} ${y + 10}L${x + shade * 0.55} ${y + 10}L${x + spread} ${floor}L${x - spread} ${floor}Z`}
        fill={`url(#${uid}-cone)`}
      />
      <ellipse cx={x} cy={floor} rx={spread * 1.25} ry={spread * 0.22} fill={`url(#${uid}-glow)`} />
      <circle cx={x} cy={y + 12} r={shade * 1.6} fill={`url(#${uid}-glow)`} />
      <path d={`M${x} ${ceiling}V${y}`} stroke={C.line} strokeOpacity="0.3" strokeWidth="1" />
      <path d={`M${x - shade / 2} ${y + 10}L${x - shade / 4} ${y}H${x + shade / 4}L${x + shade / 2} ${y + 10}Z`} fill={C.line} fillOpacity="0.75" />
    </g>
  );
}

/** Soft light pool (for coves, lamps, screens). */
export function Glow({
  uid,
  cx,
  cy,
  rx,
  ry,
  kind = "glow",
  className,
}: {
  uid: string;
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  kind?: "glow" | "glow-soft" | "glow-signal" | "glow-cool";
  className?: string;
}) {
  return <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={`url(#${uid}-${kind})`} className={className} />;
}

/** Concentric arcs for sound / signal. */
export function Waves({
  x,
  y,
  dir = 1,
  count = 3,
  gap = 16,
  start = 14,
  color = C.line,
  o = 0.22,
}: {
  x: number;
  y: number;
  dir?: 1 | -1;
  count?: number;
  gap?: number;
  start?: number;
  color?: string;
  o?: number;
}) {
  return (
    <g>
      {Array.from({ length: count }, (_, i) => {
        const r = start + i * gap;
        const sweep = dir === 1 ? 1 : 0;
        return (
          <path
            key={i}
            d={`M${x} ${y - r}A${r} ${r} 0 0 ${sweep} ${x} ${y + r}`}
            fill="none"
            stroke={color}
            strokeOpacity={o * (1 - i / (count + 1))}
            strokeWidth="1.3"
          />
        );
      })}
    </g>
  );
}
