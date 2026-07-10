/**
 * Interview instrumentation: tiny localStorage event log, exported as JSON.
 * Deliberately NOT PostHog/Umami/Vercel Analytics — their web queues drop
 * events offline, and field interviews run offline (see 05-dev-field-readiness §4).
 * Export: visit /?debug=export or use exportEvents() from the console.
 */

type EventRecord = {
  ts: number;
  type: string;
  payload?: Record<string, unknown>;
  sessionId: string;
};

const KEY = "pujabot_events";
const SESSION_KEY = "pujabot_session";

function getSessionId(): string {
  if (typeof window === "undefined") return "ssr";
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export function logEvent(type: string, payload?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  try {
    const events: EventRecord[] = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    events.push({ ts: Date.now(), type, payload, sessionId: getSessionId() });
    localStorage.setItem(KEY, JSON.stringify(events));
  } catch {
    // storage full or blocked — never break the demo over analytics
  }
}

export function exportEvents(): string {
  if (typeof window === "undefined") return "[]";
  return localStorage.getItem(KEY) ?? "[]";
}

export function resetDemo() {
  if (typeof window === "undefined") return;
  localStorage.clear();
  // Keep the Serwist cache (offline assets) — only app state resets.
  window.location.replace("/");
}
