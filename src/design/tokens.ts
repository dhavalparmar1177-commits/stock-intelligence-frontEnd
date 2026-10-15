/**
 * StockIntel Design Tokens — "Midnight Aurora" Theme
 * Dark-first, premium, calm, glowing fintech design system.
 * (To switch themes later, only this token block should need to change.)
 */

export const colors = {
  // Midnight Aurora Background layers
  bg0: "#070B14", // Page background
  bg1: "#0D1424", // Surface / Card base
  bg2: "#131C30", // Raised / Glass cards
  bg3: "#1A2540", // Hover states / Active dropdowns

  // Text hierarchy
  text1: "#F4F6FB", // Primary text
  text2: "#A3AEC7", // Secondary text / descriptions
  text3: "#6B7792", // Muted / Labels / Micro timestamps

  // Aurora Accent gradient: Violet -> Blue -> Cyan
  accentGradient: "linear-gradient(135deg, #7C5CFF 0%, #4F8CFF 60%, #22D3EE 100%)",
  accentPrimary: "#7C5CFF",
  accentBlue: "#4F8CFF",
  accentCyan: "#22D3EE",

  // Semantic deltas (12% bg tint)
  gain: "#2BD67B",
  gainBg: "rgba(43, 214, 123, 0.12)",
  gainBorder: "rgba(43, 214, 123, 0.25)",

  loss: "#FF5C6C",
  lossBg: "rgba(255, 92, 108, 0.12)",
  lossBorder: "rgba(255, 92, 108, 0.25)",

  warning: "#FFB84D",
  warningBg: "rgba(255, 184, 77, 0.12)",

  // Ambient Glows
  glowViolet: "rgba(124, 92, 255, 0.15)",
  glowCyan: "rgba(34, 211, 238, 0.10)",

  // Hairline borders
  hairline: "rgba(255, 255, 255, 0.06)",
  hairlineHover: "rgba(255, 255, 255, 0.14)",

  // Glass card background
  glassCard: "rgba(19, 28, 48, 0.60)",

  // Soft Neo-Light Mode
  light: {
    bg0: "#F6F5F2",
    bg1: "#FFFFFF",
    bg2: "#FFFFFF",
    bg3: "#F0EFEA",
    text1: "#14171F",
    text2: "#5A6478",
    text3: "#8E98A8",
    accent: "#3B3BF0",
    hairline: "rgba(0, 0, 0, 0.06)",
    hairlineHover: "rgba(0, 0, 0, 0.12)",
    glassCard: "rgba(255, 255, 255, 0.85)",
  },
} as const;

export const radius = {
  card: "20px",     // 20px cards
  button: "12px",   // 12px buttons/inputs
  full: "9999px",   // 999px chips/pills
} as const;

export const shadows = {
  glassCard: "0 20px 60px -20px rgba(0, 0, 0, 0.60), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
  glassCardHover: "0 24px 70px -15px rgba(0, 0, 0, 0.75), inset 0 1px 0 rgba(255, 255, 255, 0.10)",
  buttonGlow: "0 8px 24px -4px rgba(124, 92, 255, 0.40)",
  gainGlow: "0 0 20px -2px rgba(43, 214, 123, 0.25)",
  lossGlow: "0 0 20px -2px rgba(255, 92, 108, 0.25)",
} as const;

export const FALLBACK_TEXT = "Data unavailable" as const;

/** Format prices with Indian grouping (e.g. 24,530.80) */
export function formatPriceINR(value: unknown): string {
  if (value === null || value === undefined) return FALLBACK_TEXT;
  const n = Number(value);
  if (!Number.isFinite(n)) return FALLBACK_TEXT;
  return n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
