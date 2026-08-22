// In-memory pub/sub for upload progress (single process).
// Each job also keeps a snapshot of its latest state (and its terminal result)
// so a client that reconnects — or reloads the page mid-upload — can pick the
// progress back up instead of freezing at whatever % it last saw.
const subs = new Map(); // jobId -> Set<fn>
const state = new Map(); // jobId -> { data, at, terminal }
const KEEP_MS = 30 * 60 * 1000; // remember finished jobs for 30 minutes

function sweep() {
  const now = Date.now();
  for (const [id, s] of state) {
    if (s.terminal && now - s.at > KEEP_MS) state.delete(id);
  }
}

export function snapshot(jobId) {
  const s = state.get(jobId);
  return s ? s.data : null;
}

export function subscribe(jobId, fn) {
  if (!subs.has(jobId)) subs.set(jobId, new Set());
  subs.get(jobId).add(fn);
  // Replay the last known state right away so reconnects resume instantly.
  const s = state.get(jobId);
  if (s) {
    try {
      fn(s.data);
    } catch {}
  }
  return () => {
    const set = subs.get(jobId);
    if (set) {
      set.delete(fn);
      if (!set.size) subs.delete(jobId);
    }
  };
}

function store(jobId, data, terminal = false) {
  state.set(jobId, { data, at: Date.now(), terminal });
  sweep();
}

export function publish(jobId, data) {
  if (!jobId) return;
  store(jobId, data, !!(data.done || data.error));
  const s = subs.get(jobId);
  if (!s) return;
  for (const fn of [...s]) {
    try {
      fn(data);
    } catch {}
  }
}
export function finish(jobId, payload = {}) {
  publish(jobId, { ...payload, phase: "done", ratio: 1, done: true });
}
export function fail(jobId, error) {
  publish(jobId, { error: String(error?.message || error) });
}
