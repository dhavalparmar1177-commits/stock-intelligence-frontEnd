/**
 * StockIntel Design Tokens — Phase 1 foundation.
 *
 * Single source of truth for the visual system. Tailwind classes in
 * components reference these values; CSS variables in index.css mirror
 * them for non-Tailwind contexts (charts, third-party markup).
 *
 * Semantic color contract (do not invent new meanings):
 * - green  = positive
 * - red    = negative
 * - amber  = warning / watch
 * - blue/violet = AI
 * Everything else stays neutral.
 */

export const colors = {
  /** Page background: light neutral / dark institutional deep blue-slate. */
  background: "#f8fafc",
  backgroundDark: "#090d16",
  /** Card surface. */
  surface: "#ffffff",
  surfaceDark: "#0e1626",
  surfaceSubtleDark: "#131d31",
  /** Default 1px borders on cards. */
  border: "#e2e8f0",
  borderDark: "#1e293b",
  borderStrong: "#cbd5e1",
  borderStrongDark: "#334155",

  ink: "#0f172a",
  inkDark: "#f8fafc",
  inkSecondary: "#475569",
  inkSecondaryDark: "#94a3b8",
  inkMuted: "#94a3b8",
  inkMutedDark: "#64748b",

  brand: "#2563eb",
  brandHover: "#1d4ed8",

  positive: "#059669",
  positiveDark: "#10b981",
  positiveBg: "#dcfce7",
  positiveBgDark: "rgba(16, 185, 129, 0.12)",

  negative: "#e11d48",
  negativeDark: "#f43f5e",
  negativeBg: "#fee2e2",
  negativeBgDark: "rgba(244, 63, 94, 0.12)",

  warning: "#d97706",
  warningDark: "#f59e0b",
  warningBg: "#fef3c7",
  warningBgDark: "rgba(245, 158, 11, 0.12)",

  ai: "#7c3aed",
  aiDark: "#8b5cf6",
  aiBg: "#ede9fe",
  aiBgDark: "rgba(139, 92, 246, 0.12)",
  aiAccent: "#6366f1",
  live: "#10b981",
} as const;

export const radius = {
  sm: "0.375rem", // 6px — badges, chips
  md: "0.5rem", // 8px — inputs, buttons
  lg: "0.75rem", // 12px — cards
  xl: "1rem", // 16px — panels, modals
  full: "9999px",
} as const;

export const spacing = {
  pageX: "1rem", // 16px base page gutter (mobile)
  pageXDesktop: "1.5rem",
  sectionGap: "1rem", // vertical rhythm between cards/sections
  cardPadding: "1rem",
  cardPaddingLarge: "1.25rem",
} as const;

export const typography = {
  fontFamily:
    "Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Noto Sans', sans-serif",
  // Type scale (desktop-first, steps down gracefully on mobile)
  display: { size: "1.5rem", lineHeight: "2rem", weight: 700 }, // page titles
  title: { size: "1.125rem", lineHeight: "1.75rem", weight: 600 }, // card titles
  body: { size: "0.875rem", lineHeight: "1.5rem", weight: 400 },
  small: { size: "0.75rem", lineHeight: "1.125rem", weight: 400 },
  mono: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace", // prices
} as const;

export const shadows = {
  /** Subtle default for white cards on the neutral background. */
  card: "0 1px 2px 0 rgb(15 23 42 / 0.05)",
  /** Floating surfaces: dropdowns, tooltips, modals. */
  pop: "0 8px 24px -8px rgb(15 23 42 / 0.18)",
} as const;

/** Breakpoints mirror Tailwind defaults; layout primitives use them. */
export const breakpoints = {
  mobile: 0,
  tablet: 768, // md
  desktop: 1024, // lg
  wide: 1280, // xl
} as const;

export const FALLBACK_TEXT = "Data unavailable" as const;

/** Null-safe formatters shared by data components. Never invent values. */
export function formatPriceINR(value: unknown): string {
  if (value === null || value === undefined) return FALLBACK_TEXT;
  const n = Number(value);
  if (!Number.isFinite(n)) return FALLBACK_TEXT;
  return n.toLocaleString("en-IN");
}

export function formatPrice2dp(value: unknown): string {
  if (value === null || value === undefined) return FALLBACK_TEXT;
  const n = Number(value);
  if (!Number.isFinite(n)) return FALLBACK_TEXT;
  return n.toFixed(2);
}

export function formatPct(value: unknown, digits = 2): string {
  if (value === null || value === undefined) return FALLBACK_TEXT;
  const n = Number(value);
  if (!Number.isFinite(n)) return FALLBACK_TEXT;
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(digits)}%`;
}

export function isNonNegative(value: unknown): boolean {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0;
}
