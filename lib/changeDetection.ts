/**
 * Change detection algorithm — compares current values
 * against personal patient baseline.
 *
 * Severity:
 *   normal            — change < 15%
 *   meaningful_change — change 15–30%
 *   significant_change — change > 30%
 *
 * These thresholds are intentionally conservative.
 * Relivia NEVER predicts relapse — it only signals
 * that a meaningful deviation from the patient's
 * personal baseline was observed.
 */

import type { ChangeSeverity } from "./types";

export type ChangeResult = {
  metric: string;
  label: string;
  baseline_value: number;
  current_value: number;
  change_percent: number;
  severity: ChangeSeverity;
  direction: "up" | "down" | "stable";
};

const THRESHOLDS = {
  meaningful: 15, // %
  significant: 30, // %
};

/**
 * Compute severity from a percent change (absolute).
 */
export function getSeverity(changePercent: number): ChangeSeverity {
  const abs = Math.abs(changePercent);
  if (abs >= THRESHOLDS.significant) return "significant_change";
  if (abs >= THRESHOLDS.meaningful) return "meaningful_change";
  return "normal";
}

/**
 * Compare a single current value against its baseline.
 */
export function detectChange(
  metric: string,
  label: string,
  currentValue: number,
  baselineValue: number
): ChangeResult {
  if (baselineValue === 0) {
    return {
      metric,
      label,
      baseline_value: baselineValue,
      current_value: currentValue,
      change_percent: 0,
      severity: "normal",
      direction: "stable",
    };
  }

  const changePercent =
    ((currentValue - baselineValue) / baselineValue) * 100;
  const severity = getSeverity(changePercent);
  const direction =
    changePercent > 1 ? "up" : changePercent < -1 ? "down" : "stable";

  return {
    metric,
    label,
    baseline_value: Math.round(baselineValue * 100) / 100,
    current_value: Math.round(currentValue * 100) / 100,
    change_percent: Math.round(changePercent * 10) / 10,
    severity,
    direction,
  };
}

/**
 * Human-readable label for a metric name.
 */
export function metricLabel(metric: string): string {
  const labels: Record<string, string> = {
    sleep_hours: "Durasi tidur",
    sleep_quality: "Kualitas tidur",
    steps: "Langkah/Aktivitas",
    heart_rate: "Detak jantung",
    mood: "Suasana hati",
    social_interaction: "Interaksi sosial",
  };
  return labels[metric] ?? metric;
}

/**
 * Human-readable unit for a metric.
 */
export function metricUnit(metric: string): string {
  const units: Record<string, string> = {
    sleep_hours: "jam",
    steps: "langkah",
    heart_rate: "bpm",
    mood: "/ 5",
    sleep_quality: "/ 5",
    social_interaction: "/ 5",
  };
  return units[metric] ?? "";
}

/**
 * Run change detection across all available metrics.
 * Returns only metrics that have both a current value and a baseline.
 */
export function runChangeDetection(
  currentMetrics: Record<string, number>,
  baselines: Record<string, number>
): ChangeResult[] {
  const results: ChangeResult[] = [];

  for (const [metric, currentValue] of Object.entries(currentMetrics)) {
    if (baselines[metric] == null) continue;
    const result = detectChange(
      metric,
      metricLabel(metric),
      currentValue,
      baselines[metric]
    );
    results.push(result);
  }

  return results;
}

/**
 * Returns true if any metric has meaningful or significant change.
 */
export function hasSignificantChange(results: ChangeResult[]): boolean {
  return results.some(
    (r) => r.severity === "meaningful_change" || r.severity === "significant_change"
  );
}
