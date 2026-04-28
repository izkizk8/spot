/**
 * Formatting helpers for `audio-lab` (feature 020, T042).
 *
 * - `bytesToHuman(n)` — humanizes byte counts per R-009.
 * - `formatDurationMs(ms)` — `H:MM:SS` for ≥ 1h, else `M:SS` (FR-010).
 *
 * Both functions are pure; no platform branches.
 */

const KB = 1024;
const MB = KB * 1024;
const GB = MB * 1024;

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/**
 * `< 1024` → `"NNN B"`, `< 1024²` → `"N.N KB"`, `< 1024³` → `"N.N MB"`,
 * else `"N.N GB"`. Negative inputs are clamped to 0.
 */
export function bytesToHuman(n: number): string {
  if (!Number.isFinite(n) || n < 0) return '0 B';
  if (n < KB) return `${Math.floor(n)} B`;
  if (n < MB) return `${(n / KB).toFixed(1)} KB`;
  if (n < GB) return `${(n / MB).toFixed(1)} MB`;
  return `${(n / GB).toFixed(1)} GB`;
}

/**
 * `≥ 1h` → `"H:MM:SS"`, else `"M:SS"`. Sub-second values floor to `0:00`.
 * Negative inputs are clamped to 0.
 */
export function formatDurationMs(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor((Number.isFinite(ms) ? ms : 0) / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}:${pad2(m)}:${pad2(s)}`;
  return `${m}:${pad2(s)}`;
}
