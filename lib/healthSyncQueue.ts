/**
 * Offline queue for health data (PRD §31–§32).
 *
 *   Health Connect → local queue → network? → SYNC : QUEUE
 *
 * Used by the web layer when POST /api/health-sync fails due to network.
 * The native WorkManager path has its own retry (Result.retry) — this queue
 * covers foreground syncs from the browser / WebView.
 */

export type QueuedHealthPayload = {
  patientId: string;
  source: string;
  data: Array<{
    dataType: string;
    value: number;
    unit: string;
    recordedAt?: string;
  }>;
  enqueuedAt: string;
};

const STORAGE_KEY = "relivia_health_queue_v1";
const MAX_QUEUE = 50;

function loadQueue(): QueuedHealthPayload[] {
  try {
    if (typeof window === "undefined") return [];
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveQueue(items: QueuedHealthPayload[]): void {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_QUEUE)));
  } catch {
    /* storage full / unavailable — drop silently, never crash */
  }
}

/** Add a payload to the local queue (when network is unavailable). */
export function enqueueHealth(payload: QueuedHealthPayload): number {
  const q = loadQueue();
  q.push(payload);
  saveQueue(q);
  return q.length;
}

/** Number of payloads waiting for network. */
export function queuedCount(): number {
  return loadQueue().length;
}

async function postPayload(payload: QueuedHealthPayload): Promise<boolean> {
  const res = await fetch("/api/health-sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      patientId: payload.patientId,
      source: payload.source,
      data: payload.data,
    }),
  });
  return res.ok;
}

/**
 * POST with offline fallback. Returns { synced, queued }.
 * Network errors → payload is queued for the next flush (never throws).
 */
export async function postHealthWithQueue(payload: QueuedHealthPayload): Promise<{
  synced: boolean;
  queued: boolean;
  response?: unknown;
}> {
  try {
    const res = await fetch("/api/health-sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patientId: payload.patientId,
        source: payload.source,
        data: payload.data,
      }),
    });
    if (res.ok) {
      const json = await res.json().catch(() => ({}));
      return { synced: true, queued: false, response: json };
    }
    // 5xx / 429 → queue for retry. 4xx → validation/auth, do not queue.
    if (res.status >= 500 || res.status === 429) {
      enqueueHealth(payload);
      return { synced: false, queued: true };
    }
    return { synced: false, queued: false };
  } catch {
    enqueueHealth(payload);
    return { synced: false, queued: true };
  }
}

/** Flush all queued payloads (call on app open / online event). */
export async function flushHealthQueue(): Promise<{
  flushed: number;
  remaining: number;
}> {
  const q = loadQueue();
  if (q.length === 0) return { flushed: 0, remaining: 0 };
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return { flushed: 0, remaining: q.length };
  }
  const remaining: QueuedHealthPayload[] = [];
  let flushed = 0;
  for (const payload of q) {
    try {
      const ok = await postPayload(payload);
      if (ok) flushed++;
      else remaining.push(payload);
    } catch {
      remaining.push(payload);
    }
  }
  saveQueue(remaining);
  return { flushed, remaining: remaining.length };
}
