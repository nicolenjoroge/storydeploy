// formatters.js — Pure display-formatting functions. No DOM, no side effects.

import { BADGE_CLASS, TYPE_ICONS, CARD_BG, TYPE_ACCENT, BENEFIT_LABELS } from "./config.js";

/** Escapes a value for safe insertion into HTML strings. */
export function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** snake_case → Title Case. e.g. "man_hours_saved" → "Man Hours Saved" */
export function humanizeKey(key) {
  return String(key || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Formats a tangible_benefit { type, value } into a compact display string. */
export function formatBenefitValue(b) {
  const val  = Number(b.value);
  const type = String(b.type || "").toLowerCase();
  if (type.includes("kes")) {
    if (val >= 1_000_000)
      return `KES ${(val / 1_000_000).toFixed(2).replace(/\.00$/, "")}M`;
    return `KES ${val.toLocaleString()}`;
  }
  if (type.includes("pct") || type.includes("percent")) return `${val}%`;
  if (val >= 1_000_000)
    return `${(val / 1_000_000).toFixed(2).replace(/\.00$/, "")}M`;
  return val.toLocaleString();
}

/** Human-readable label for a benefit type. */
export function benefitLabel(b) {
  let label = humanizeKey(b.type).replace(/\bKes\b/i, "").trim();
  return label || "Impact";
}

/**
 * Splits a raw metric value into { prefix, target, suffix } for counter animation.
 * e.g. 8_500_000 → { prefix: "KES ", target: 8.5, suffix: "M" }
 */
export function splitMetricValue(key, value) {
  const v    = Number(value) || 0;
  const isKes = String(key).toLowerCase().includes("kes");
  let target = v, suffix = "";
  if (v >= 1_000_000) { target = +(v / 1_000_000).toFixed(2); suffix = "M"; }
  else if (v >= 10_000) { target = Math.round(v / 1000); suffix = "K"; }
  return { prefix: isKes ? "KES " : "", target, suffix };
}

/** Formats a benefit using the BENEFIT_LABELS lookup, falling back to a generic string. */
export function formatBenefit(b) {
  const meta = BENEFIT_LABELS[b.type];
  if (meta) return `${meta.format(b.value)} ${meta.label}`;
  return `${b.value} ${(b.type || "").replace(/_/g, " ")}`;
}

export function badgeClass(t) { return BADGE_CLASS[t] || "badge-app"; }
export function typeIcon(t)   { return TYPE_ICONS[t]  || "🔷"; }
export function cardBg(t)     { return CARD_BG[t]     || "#2a2320"; }
export function typeAccent(t) { return TYPE_ACCENT[t] || "var(--sky)"; }
