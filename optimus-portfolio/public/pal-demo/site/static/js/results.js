// Results are local simulation measurements. Package fingerprints and protocol
// versions prevent a changed export or a short diagnostic run from gaining rank.
import { RUNTIME_REVISION, canonicalJSON, digest } from './runtime-profile.js';
export const API_ROOT = new URL('../../../', import.meta.url);
const DB_NAME = 'tund-portfolio-k1-gauntlet';
let database;
const storage = new WeakMap();
const MAX_SHARED_BYTES = 16 * 1024 * 1024;
const validSlug = value => typeof value === 'string' && /^[A-Za-z0-9][A-Za-z0-9_-]{0,79}\/[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/.test(value);
export function resultStorage(result) {
  return { local: false, server: false, shared: false, sharedLatest: null, ...(result && storage.get(result)) };
}
function remember(result, patch) {
  storage.set(result, { ...resultStorage(result), ...patch });
}
function completeFull(result) {
  const record = value => value && typeof value === 'object' && !Array.isArray(value);
  return result?.status === 'complete' && result.suite === 'full' && validSlug(result.policy?.slug)
    && typeof result.rankable === 'boolean' && record(result.summary) && record(result.scores)
    && (typeof result.version === 'string' || Number.isInteger(result.version))
    && typeof result.policy.fingerprint === 'string' && result.policy.fingerprint.length > 0
    && Number.isFinite(Date.parse(result.completedAt))
    && Array.isArray(result.attempts) && result.attempts.every(record)
    && Number.isInteger(result.plannedAttempts) && result.plannedAttempts > 0 && result.plannedAttempts <= 4096
    && result.completedAttempts === result.plannedAttempts && result.completedAttempts === result.attempts.length;
}
function finiteJSON(key, value) {
  if (typeof value === 'number' && !Number.isFinite(value)) throw Error('Shared evaluations must contain finite JSON values.');
  return value;
}
function validSharedEntry(entry) {
  return entry && validSlug(entry.slug) && entry.file === `${entry.slug}.json`
    && Number.isFinite(Date.parse(entry.completedAt)) && typeof entry.fingerprint === 'string'
    && /^(?:[a-f0-9]{64})$/.test(entry.sha256) && Number.isInteger(entry.bytes)
    && entry.bytes > 0 && entry.bytes <= MAX_SHARED_BYTES;
}
async function sharedResults() {
  try {
    const base = new URL('saved-evaluations/', API_ROOT);
    const response = await fetch(new URL('index.json', base), { cache: 'no-store' });
    if (!response.ok) return [];
    const index = await response.json();
    if (index.version !== 1 || !Array.isArray(index.results)) return [];
    const seen = new Set();
    const entries = index.results.filter(entry => {
      if (!validSharedEntry(entry) || seen.has(entry.slug)) return false;
      seen.add(entry.slug); return true;
    });
    return (await Promise.all(entries.map(async entry => {
      try {
        const response = await fetch(new URL(entry.file, base), { cache: 'no-store' });
        if (!response.ok) return null;
        const bytes = await response.arrayBuffer();
        if (bytes.byteLength !== entry.bytes || await digest(bytes) !== entry.sha256) return null;
        const result = JSON.parse(new TextDecoder().decode(bytes), finiteJSON);
        if (!completeFull(result) || result.policy.slug !== entry.slug || result.policy.fingerprint !== entry.fingerprint
          || result.completedAt !== entry.completedAt || result.version !== entry.version) return null;
        return { result, entry };
      } catch { return null; }
    }))).filter(Boolean);
  } catch { return []; }
}
function openDatabase() {
  if (!database) database = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore('results', { keyPath: 'policy.slug' });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return database;
}
async function localResults() {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const request = db.transaction('results').objectStore('results').getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
async function putLocal(result) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('results', 'readwrite');
    transaction.objectStore('results').put(result);
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
  });
}
export async function capabilities() {
  // Portfolio adaptation: static hosting, no backend or write API is required.
  return {};
}
export async function getResults() {
  const [local, caps, shared] = await Promise.all([localResults().catch(() => []), capabilities(), sharedResults()]);
  const all = local.map(result => ({ result, source: 'local' }));
  all.push(...shared.map(item => ({ ...item, source: 'shared' })));
  if (caps.evaluations) {
    try {
      const response = await fetch(new URL('api/results', API_ROOT));
      if (response.ok) {
        const results = (await response.json()).results;
        if (Array.isArray(results)) all.push(...results.map(result => ({ result, source: 'server' })));
      }
    } catch { /* Cached results remain usable offline. */ }
  }
  const latest = new Map();
  const valid = [];
  for (const item of all) {
    const { result } = item;
    const slug = result?.policy?.slug;
    if (!validSlug(slug) || !Array.isArray(result.attempts) || !Number.isFinite(Date.parse(result.completedAt))) continue;
    valid.push(item);
    const previous = latest.get(slug);
    if (!previous || Date.parse(result.completedAt) > Date.parse(previous.completedAt)
      || (Date.parse(result.completedAt) === Date.parse(previous.completedAt) && item.source === 'shared')) latest.set(slug, result);
  }
  for (const [slug, result] of latest) {
    const candidates = valid.filter(item => item.result.policy.slug === slug);
    const representation = canonicalJSON(JSON.parse(JSON.stringify(result)));
    const matching = candidates.filter(item => canonicalJSON(JSON.parse(JSON.stringify(item.result))) === representation);
    remember(result, { local: matching.some(item => item.source === 'local'),
      server: matching.some(item => item.source === 'server'), shared: matching.some(item => item.source === 'shared'),
      sharedLatest: candidates.find(item => item.source === 'shared')?.entry || null });
  }
  return latest;
}
export async function saveResult(result) {
  const saved = { local: false, server: false, error: '' };
  try { await putLocal(result); saved.local = true; } catch (error) { saved.error = error.message; }
  if ((await capabilities()).evaluations) {
    try {
      const response = await fetch(new URL('api/results', API_ROOT), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: result.policy.slug, result }),
      });
      if (!response.ok) throw new Error((await response.json()).error || 'Could not save to disk.');
      saved.server = true;
    } catch (error) { saved.error = error.message; }
  }
  remember(result, { local: saved.local, server: saved.server });
  return saved;
}
export async function saveSharedResult(result) {
  if (!completeFull(result)) throw Error('Only completed full evaluations can be saved to the gallery.');
  const body = JSON.stringify({ slug: result.policy.slug, result }, finiteJSON);
  if (new TextEncoder().encode(body).byteLength > MAX_SHARED_BYTES) throw Error('This scorecard exceeds the 16 MiB shared-save limit.');
  if (!(await capabilities()).sharedEvaluations) throw Error('Use the local gallery helper server to save an evaluation into the repository.');
  const response = await fetch(new URL('api/shared-results', API_ROOT), {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body,
  });
  const saved = await response.json();
  if (!response.ok) throw Error(saved.error || 'Could not save the evaluation to the gallery.');
  if (!saved.saved || !validSharedEntry(saved.entry) || saved.entry.slug !== result.policy.slug
    || saved.entry.completedAt !== result.completedAt || saved.entry.fingerprint !== result.policy.fingerprint
    || saved.entry.version !== result.version) throw Error('The gallery returned an invalid saved-evaluation record.');
  remember(result, { shared: true, sharedLatest: saved.entry });
  return saved;
}
export async function saveSharedResults(results, { onProgress = () => {} } = {}) {
  const candidates = [...results].filter(completeFull);
  const outcomes = [];
  for (const result of candidates) {
    onProgress({ completed: outcomes.length, total: candidates.length, result, outcomes });
    try { outcomes.push({ result, saved: await saveSharedResult(result) }); }
    catch (error) { outcomes.push({ result, error: error.message }); }
  }
  onProgress({ completed: outcomes.length, total: candidates.length, result: null, outcomes });
  return outcomes;
}
export function isRanked(result, entry, version) {
  return Boolean(result && result.rankable && result.status === 'complete' && result.suite === 'full'
    && result.policy?.verification?.eligible===true && result.policy.verification.runtimeRevision===RUNTIME_REVISION
    && entry.profile?.trainingMatch==='source-reconstructed' && entry.profile.validationStatus==='passed'
    && entry.profile.runtimeRevision===RUNTIME_REVISION
    && result.version === version && entry.fingerprint && result.policy?.fingerprint === entry.fingerprint
    && Number.isFinite(result.scores?.dependability) && Number.isFinite(result.scores?.performance));
}
export function downloadResult(result) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url; link.download = `${result.policy.slug.replaceAll('/', '-')}-gauntlet.json`;
  link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export async function fingerprintAssets(assets) {
  const hex = bytes => Array.from(new Uint8Array(bytes), n => n.toString(16).padStart(2, '0')).join('');
  const pairs = await Promise.all([...assets].map(async ([path, bytes]) => [path, hex(await crypto.subtle.digest('SHA-256', bytes))]));
  pairs.sort((a, b) => a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0);
  return hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(pairs))));
}
export function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
export function timestamp(iso, label = 'Added', className = 'policy-added') {
  const node = element('span', className);
  const date = iso ? new Date(iso) : null;
  if (!date || !Number.isFinite(date.getTime())) {
    node.textContent = `${label} time not recorded`;
    return node;
  }
  const time = element('time', '', new Intl.DateTimeFormat(undefined, {
    year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short',
  }).format(date));
  time.dateTime = iso;
  time.title = iso;
  node.append(`${label} `, time);
  return node;
}
export const format = (value, digits = 2) => Number.isFinite(value) ? value.toFixed(digits) : '—';
