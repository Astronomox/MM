// components/ui.tsx — shared primitives converted from design system
// All theme values come from CSS variables (tokens.css)

import React from "react";

// ─── TYPES ────────────────────────────────────────────────────────────────────

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "link";
export type ButtonSize = "sm" | "md" | "lg" | "xl";
export type BadgeTone = "neutral" | "accent" | "success" | "warn" | "danger" | "info" | "outline";

// ─── LOGO MARK ────────────────────────────────────────────────────────────────

export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect x="1" y="1" width="30" height="30" rx="5" fill="var(--accent)" />
      <rect x="7"  y="13" width="2.4" height="6"  rx="1" fill="var(--ink)" />
      <rect x="11" y="10" width="2.4" height="12" rx="1" fill="var(--ink)" />
      <rect x="15" y="7"  width="2.4" height="18" rx="1" fill="var(--ink)" />
      <rect x="19" y="10" width="2.4" height="12" rx="1" fill="var(--ink)" />
      <rect x="23" y="13" width="2.4" height="6"  rx="1" fill="var(--ink)" />
    </svg>
  );
}

export function Wordmark({ size = 18, withMark = true }: { size?: number; withMark?: boolean }) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
      {withMark && <LogoMark size={size + 8} />}
      <span style={{
        fontFamily: "var(--font-serif)",
        fontWeight: 500,
        fontSize: size,
        letterSpacing: "-0.01em",
        color: "var(--ink)",
        fontStyle: "italic",
      }}>
        Meeting<span style={{ color: "var(--accent)", fontStyle: "normal", fontWeight: 600 }}>memo</span>
      </span>
    </div>
  );
}

// ─── BUTTON ───────────────────────────────────────────────────────────────────

const BUTTON_SIZES = {
  sm: { height: 28, px: 10, fs: 12.5, gap: 6, iconSz: 14 },
  md: { height: 36, px: 14, fs: 13.5, gap: 8,  iconSz: 16 },
  lg: { height: 44, px: 18, fs: 15,   gap: 8,  iconSz: 18 },
  xl: { height: 52, px: 22, fs: 16,   gap: 10, iconSz: 20 },
};

const BUTTON_VARIANTS: Record<ButtonVariant, React.CSSProperties> = {
  primary:   { background: "var(--accent)",   color: "var(--accent-ink)", border: "1px solid var(--accent)" },
  secondary: { background: "var(--surface)",  color: "var(--ink)",        border: "1px solid var(--line2)" },
  outline:   { background: "transparent",     color: "var(--ink)",        border: "1px solid var(--line2)" },
  ghost:     { background: "transparent",     color: "var(--ink2)",       border: "1px solid transparent" },
  danger:    { background: "var(--danger)",   color: "#fff",              border: "1px solid var(--danger)" },
  link:      { background: "transparent",     color: "var(--accent)",     border: "none" },
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  full?: boolean;
  leadIcon?: React.ReactNode;
  trailIcon?: React.ReactNode;
  href?: string;
}

export function Button({
  variant = "primary", size = "md", full, leadIcon, trailIcon,
  children, style, href, ...rest
}: ButtonProps) {
  const s = BUTTON_SIZES[size];
  const v = BUTTON_VARIANTS[variant];
  const base: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    gap: s.gap, height: s.height, padding: `0 ${s.px}px`,
    fontFamily: "var(--font-sans)", fontSize: s.fs, fontWeight: 500,
    letterSpacing: "-0.005em", cursor: "pointer",
    borderRadius: variant === "link" ? 0 : "var(--r-md)",
    transition: "background 120ms, opacity 120ms",
    textDecoration: "none", whiteSpace: "nowrap",
    width: full ? "100%" : "auto",
    ...v, ...style,
  };
  if (href) {
    return <a href={href} style={base}>{leadIcon}{children}{trailIcon}</a>;
  }
  return (
    <button style={base} {...rest}>
      {leadIcon}{children}{trailIcon}
    </button>
  );
}

// ─── BADGE ────────────────────────────────────────────────────────────────────

const BADGE_TONES: Record<BadgeTone, React.CSSProperties> = {
  neutral: { background: "var(--surface2)",   color: "var(--ink3)",      border: "1px solid var(--line)" },
  accent:  { background: "var(--accent-bg)",  color: "var(--accent-hi)", border: "1px solid var(--accent-line)" },
  success: { background: "var(--success-bg)", color: "var(--success)",   border: "1px solid var(--success-bg)" },
  warn:    { background: "var(--warn-bg)",    color: "var(--warn)",      border: "1px solid var(--warn-bg)" },
  danger:  { background: "var(--danger-bg)",  color: "var(--danger)",    border: "1px solid var(--danger-bg)" },
  info:    { background: "var(--info-bg)",    color: "var(--info)",      border: "1px solid var(--info-bg)" },
  outline: { background: "transparent",       color: "var(--ink2)",      border: "1px solid var(--line2)" },
};

interface BadgeProps {
  tone?: BadgeTone;
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export function Badge({ tone = "neutral", size = "md", children, style }: BadgeProps) {
  const sizes = { sm: { h: 18, px: 6, fs: 10.5 }, md: { h: 22, px: 8, fs: 11.5 }, lg: { h: 26, px: 10, fs: 12 } }[size];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      height: sizes.h, padding: `0 ${sizes.px}px`,
      borderRadius: 999,
      fontFamily: "var(--font-sans)", fontSize: sizes.fs, fontWeight: 500,
      letterSpacing: "0.01em", whiteSpace: "nowrap",
      ...BADGE_TONES[tone], ...style,
    }}>{children}</span>
  );
}

// ─── CARD ─────────────────────────────────────────────────────────────────────

interface CardProps {
  children: React.ReactNode;
  padding?: number | string;
  style?: React.CSSProperties;
  onClick?: () => void;
  hover?: boolean;
}

export function Card({ children, padding = 20, style, onClick, hover }: CardProps) {
  return (
    <div
      onClick={onClick}
      style={{
        background: "var(--surface)",
        border: "1px solid var(--line)",
        borderRadius: "var(--r-lg)",
        padding,
        boxShadow: "var(--shadow-sm)",
        cursor: onClick ? "pointer" : "default",
        transition: "border-color 120ms, box-shadow 120ms",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ─── INPUT ────────────────────────────────────────────────────────────────────

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  leadIcon?: React.ReactNode;
  trailIcon?: React.ReactNode;
  inputSize?: "sm" | "md" | "lg";
  full?: boolean;
  wrapStyle?: React.CSSProperties;
}

export function Input({ leadIcon, trailIcon, inputSize = "md", full = true, wrapStyle, style, ...rest }: InputProps) {
  const sizes = {
    sm: { h: 30, fs: 13,   px: 10 },
    md: { h: 38, fs: 13.5, px: 12 },
    lg: { h: 44, fs: 14.5, px: 14 },
  }[inputSize];
  return (
    <div style={{
      display: "flex", alignItems: "center",
      background: "var(--surface)",
      border: "1px solid var(--line2)",
      borderRadius: "var(--r-md)",
      height: sizes.h, padding: `0 ${sizes.px}px`,
      width: full ? "100%" : "auto",
      gap: 8,
      ...wrapStyle,
    }}>
      {leadIcon && <span style={{ color: "var(--ink3)", flexShrink: 0 }}>{leadIcon}</span>}
      <input
        style={{
          flex: 1, minWidth: 0,
          background: "transparent", border: "none", outline: "none",
          fontFamily: "var(--font-sans)", fontSize: sizes.fs, color: "var(--ink)",
          ...style,
        }}
        {...rest}
      />
      {trailIcon && <span style={{ color: "var(--ink3)", flexShrink: 0 }}>{trailIcon}</span>}
    </div>
  );
}

// ─── FIELD ────────────────────────────────────────────────────────────────────

export function Field({ label, hint, children, style }: {
  label?: string; hint?: string; children: React.ReactNode; style?: React.CSSProperties;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, ...style }}>
      {label && (
        <label style={{ fontSize: 12.5, fontWeight: 500, color: "var(--ink2)", letterSpacing: "-0.003em" }}>
          {label}
        </label>
      )}
      {children}
      {hint && <p style={{ fontSize: 11.5, color: "var(--ink3)", margin: 0 }}>{hint}</p>}
    </div>
  );
}

// ─── SEPARATOR ────────────────────────────────────────────────────────────────

export function Sep({ vertical, style }: { vertical?: boolean; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: "var(--line)",
      width: vertical ? 1 : "100%",
      height: vertical ? "100%" : 1,
      flexShrink: 0,
      ...style,
    }} />
  );
}

// ─── EYEBROW ──────────────────────────────────────────────────────────────────

export function Eyebrow({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <span style={{
      fontFamily: "var(--font-sans)",
      fontSize: 10.5, fontWeight: 500,
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      color: "var(--ink3)",
      ...style,
    }}>
      {children}
    </span>
  );
}

// ─── AVATAR ───────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  { bg: "#e6f1fb", ink: "#0c447c" },
  { bg: "#e1f5ee", ink: "#085041" },
  { bg: "#faeeda", ink: "#633806" },
  { bg: "#eeedfe", ink: "#3c3489" },
  { bg: "#fbeaf0", ink: "#72243e" },
  { bg: "#eaf3de", ink: "#27500a" },
];

export function Avatar({ name, size = 28 }: { name: string; size?: number }) {
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length;
  const { bg, ink } = AVATAR_COLORS[idx];
  const initials = name.split(" ").map(p => p[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: bg, color: ink,
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.38, fontWeight: 600,
      flexShrink: 0,
      border: "1.5px solid var(--surface)",
    }}>
      {initials}
    </div>
  );
}

// ─── PROGRESS ─────────────────────────────────────────────────────────────────

export function Progress({ value, height = 4 }: { value: number; height?: number }) {
  return (
    <div style={{ height, background: "var(--line)", borderRadius: 999, overflow: "hidden" }}>
      <div style={{
        height: "100%",
        width: `${Math.min(100, value)}%`,
        background: "var(--accent)",
        borderRadius: 999,
        transition: "width 400ms ease",
      }} />
    </div>
  );
}

// ─── STATUS HELPERS ───────────────────────────────────────────────────────────

export function statusTone(status: string): BadgeTone {
  if (status === "DONE") return "success";
  if (status === "FAILED") return "danger";
  if (["TRANSCRIBING", "SUMMARIZING", "GENERATING_PDF", "UPLOADING"].includes(status)) return "info";
  return "neutral";
}

export function statusLabel(status: string): string {
  const map: Record<string, string> = {
    DONE: "Done", FAILED: "Failed", TRANSCRIBING: "Transcribing",
    SUMMARIZING: "Summarizing", GENERATING_PDF: "Generating PDF", UPLOADING: "Uploading",
  };
  return map[status] || status;
}

export function fmtDur(s: number): string {
  return `${Math.floor(s / 60)}m ${(s % 60).toString().padStart(2, "0")}s`;
}

export function fmtDurShort(s: number): string {
  return `${Math.floor(s / 60)}m`;
}

export function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function fmtDateLong(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}
