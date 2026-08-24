import { stmt } from "./db.js";

// Live pub/sub is in-memory; authoritative progress and history are persisted.
const subs = new Map(); // jobId -> Set<fn>
const state = new Map(); // jobId -> { data, at, terminal, meta }
const pendingWrites = new Map();
const KEEP_MS = 30 * 60 * 1000;
const HISTORY_MS = 30 * 24 * 60 * 60 * 1000;

function sweep() {
  const now = Date.now();
  for (const [id, s] of state) {
    if (s.terminal && now - s.at > KEEP_MS) state.delete(id);
  }
}

export function snapshot(jobId, userId) {
  const s = state.get(jobId);
  if (s && (!userId || s.meta?.userId === userId)) return s.data;
  if (!userId) return null;
  const row = stmt.getUploadJob.get(jobId, userId);
  if (!row) return null;
  try { return JSON.parse(row.state_json); } catch { return null; }
}

export function subscribe(jobId, userId, fn) {
  const existing = state.get(jobId);
  if (existing && existing.meta?.userId !== userId) return null;
  if (!existing && !stmt.getUploadJob.get(jobId, userId)) return null;
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

export function start(jobId, meta) {
  if (!jobId) return;
  const owner = stmt.getUploadJobAny.get(jobId);
  if (owner && owner.user_id !== meta.userId) throw new Error("Upload job already exists");
  const now = Date.now();
  const data = { phase: "receiving", received: 0, size: Number(meta.size) || 0, ratio: 0 };
  state.set(jobId, { data, at: now, terminal: false, meta });
  persist(jobId, true);
}

function persist(jobId, immediate = false) {
  const s = state.get(jobId);
  if (!s?.meta) return;
  const write = () => {
    pendingWrites.delete(jobId);
    const latest = state.get(jobId);
    if (!latest?.meta) return;
    const now = Date.now();
    stmt.upsertUploadJob.run({
      id: jobId, user_id: latest.meta.userId, account_id: latest.meta.accountId,
      folder_id: latest.meta.folderId || null, name: latest.meta.name || "file",
      size: Number(latest.meta.size || latest.data.total || latest.data.size) || 0,
      phase: latest.data.error ? "error" : latest.data.done ? "done" : latest.data.phase || "uploading",
      state_json: JSON.stringify(latest.data), created_at: latest.meta.createdAt || now,
      updated_at: now, finished_at: latest.terminal ? now : null,
    });
    if (latest.terminal) stmt.deleteOldUploadJobs.run(now - HISTORY_MS);
  };
  if (immediate) return write();
  if (!pendingWrites.has(jobId)) pendingWrites.set(jobId, setTimeout(write, 500));
}

function store(jobId, data, terminal = false) {
  const previous = state.get(jobId);
  const merged = { ...(previous?.data || {}), ...data };
  state.set(jobId, { data: merged, at: Date.now(), terminal, meta: previous?.meta });
  persist(jobId, terminal);
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
