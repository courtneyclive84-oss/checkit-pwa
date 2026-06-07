/**
 * KiP Scan History Module
 * ScanSmart Ltd — Client-side scan journal using IndexedDB
 *
 * ─── INTEGRATION INSTRUCTIONS ───
 *
 * 1. Add to your HTML:
 *    <script src="scan-history.js"></script>
 *
 * 2. After a successful barcode scan, call:
 *    ScanHistory.save({
 *      barcode: '5000128065253',
 *      productName: 'Heinz Baked Beans',
 *      brand: 'Heinz',
 *      trafficLight: 'green',        // "green" | "amber" | "red"
 *      sugarTeaspoons: 1.2,          // or null
 *      saltSachets: 0.8,             // or null
 *      userCondition: 'type2diabetes' // the condition that drove the verdict
 *    });
 *
 * 3. Add a History button to your nav:
 *    <a href="scan-history.html">History</a>
 *
 * 4. On the scan result screen, add a favourite toggle:
 *    <button onclick="ScanHistory.toggleFavourite(scanId)">♥</button>
 */

const ScanHistory = (() => {
  const DB_NAME = 'kip-scan-history';
  const DB_VERSION = 1;
  const STORE_NAME = 'scans';
  const PAGE_SIZE = 50;

  let _db = null;

  // ── Open / Upgrade DB ──

  function openDB() {
    if (_db) return Promise.resolve(_db);
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('barcode', 'barcode', { unique: false });
          store.createIndex('trafficLight', 'trafficLight', { unique: false });
          store.createIndex('isFavourite', 'isFavourite', { unique: false });
        }
      };
      req.onsuccess = (e) => { _db = e.target.result; resolve(_db); };
      req.onerror = (e) => reject(e.target.error);
    });
  }

  function tx(mode) {
    return openDB().then(db => {
      const t = db.transaction(STORE_NAME, mode);
      return t.objectStore(STORE_NAME);
    });
  }

  function reqToPromise(req) {
    return new Promise((resolve, reject) => {
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  // ── UUID ──

  function uuid() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  }

  // ── CRUD ──

  async function save(scanResult) {
    const record = {
      id: uuid(),
      timestamp: new Date().toISOString(),
      barcode: String(scanResult.barcode || ''),
      productName: String(scanResult.productName || 'Unknown Product'),
      brand: scanResult.brand || null,
      trafficLight: ['green', 'amber', 'red'].includes(scanResult.trafficLight)
        ? scanResult.trafficLight : 'amber',
      sugarTeaspoons: typeof scanResult.sugarTeaspoons === 'number' ? scanResult.sugarTeaspoons : null,
      saltSachets: typeof scanResult.saltSachets === 'number' ? scanResult.saltSachets : null,
      isFavourite: false,
      userCondition: String(scanResult.userCondition || ''),
      // Where the product data came from: i500 | off | contribution. Powers hit-rate analytics.
      source: ['i500', 'off', 'contribution'].includes(scanResult.source) ? scanResult.source : null,
      // User intent captured AFTER the scan via Buy / Put back / Just looking buttons.
      // null = user skipped the choice. "buy" = went in basket (affects daily tracker).
      // "put_back" = rejected after reading. "viewed" = curiosity scan, no shopping.
      decision: null
    };
    const store = await tx('readwrite');
    await reqToPromise(store.add(record));
    return record;
  }

  async function setDecision(id, decision) {
    if (!['buy', 'put_back', 'viewed', null].includes(decision)) return null;
    const store = await tx('readwrite');
    const record = await reqToPromise(store.get(id));
    if (!record) return null;
    record.decision = decision;
    await reqToPromise(store.put(record));
    return record;
  }

  async function getById(id) {
    const store = await tx('readonly');
    return reqToPromise(store.get(id));
  }

  async function getAll(opts = {}) {
    const page = opts.page || 1;
    const filter = opts.filter || 'all';           // "all"|"green"|"amber"|"red"
    const decision = opts.decision || 'all';       // "all"|"buy"|"put_back"|"viewed"
    const search = (opts.search || '').toLowerCase().trim();
    const favouritesOnly = opts.favouritesOnly || false;

    const store = await tx('readonly');
    const all = await reqToPromise(store.index('timestamp').getAll());

    // reverse chronological
    all.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

    // apply filters
    let filtered = all;
    if (filter !== 'all') {
      filtered = filtered.filter(r => r.trafficLight === filter);
    }
    if (decision !== 'all') {
      filtered = filtered.filter(r => r.decision === decision);
    }
    if (favouritesOnly) {
      filtered = filtered.filter(r => r.isFavourite);
    }
    if (search) {
      filtered = filtered.filter(r =>
        (r.productName || '').toLowerCase().includes(search) ||
        (r.brand || '').toLowerCase().includes(search)
      );
    }

    const total = filtered.length;
    const start = (page - 1) * PAGE_SIZE;
    const items = filtered.slice(start, start + PAGE_SIZE);
    const hasMore = start + PAGE_SIZE < total;

    return { items, total, page, hasMore };
  }

  async function toggleFavourite(id) {
    const store = await tx('readwrite');
    const record = await reqToPromise(store.get(id));
    if (!record) return null;
    record.isFavourite = !record.isFavourite;
    await reqToPromise(store.put(record));
    return record;
  }

  async function deleteRecord(id) {
    const store = await tx('readwrite');
    await reqToPromise(store.delete(id));
  }

  async function getStats() {
    const store = await tx('readonly');
    const all = await reqToPromise(store.getAll());
    const stats = { total: all.length, green: 0, amber: 0, red: 0, favourites: 0 };
    all.forEach(r => {
      if (r.trafficLight === 'green') stats.green++;
      else if (r.trafficLight === 'amber') stats.amber++;
      else if (r.trafficLight === 'red') stats.red++;
      if (r.isFavourite) stats.favourites++;
    });
    return stats;
  }

  // Aggregate decision impact since a given ISO timestamp.
  // Default: this week (7 days ago). Used by the "KiP saved you" card.
  async function getImpact(sinceIso) {
    const since = sinceIso || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const store = await tx('readonly');
    const all = await reqToPromise(store.getAll());
    const recent = all.filter(r => r.timestamp >= since);
    const impact = {
      since,
      total: recent.length,
      bought: 0, put_back: 0, viewed: 0,
      sugarAvoidedTsp: 0,
      saltAvoidedSachets: 0,
      sugarBoughtTsp: 0,
      saltBoughtSachets: 0
    };
    recent.forEach(r => {
      if (r.decision === 'buy') {
        impact.bought++;
        impact.sugarBoughtTsp += (r.sugarTeaspoons || 0);
        impact.saltBoughtSachets += (r.saltSachets || 0);
      } else if (r.decision === 'put_back') {
        impact.put_back++;
        impact.sugarAvoidedTsp += (r.sugarTeaspoons || 0);
        impact.saltAvoidedSachets += (r.saltSachets || 0);
      } else if (r.decision === 'viewed') {
        impact.viewed++;
      }
    });
    // Round numbers for display
    impact.sugarAvoidedTsp = Math.round(impact.sugarAvoidedTsp * 10) / 10;
    impact.saltAvoidedSachets = Math.round(impact.saltAvoidedSachets * 10) / 10;
    impact.sugarBoughtTsp = Math.round(impact.sugarBoughtTsp * 10) / 10;
    impact.saltBoughtSachets = Math.round(impact.saltBoughtSachets * 10) / 10;
    return impact;
  }

  async function exportJSON() {
    const store = await tx('readonly');
    const all = await reqToPromise(store.getAll());
    all.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    const blob = new Blob([JSON.stringify(all, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kip-scan-history-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return all.length;
  }

  async function clearAll() {
    const store = await tx('readwrite');
    await reqToPromise(store.clear());
  }

  // ── Send to KiP (opt-in, consented) ──
  // POSTs the full scan history to the KiP data worker, which writes to Cloudflare D1.
  // Returns { ok, scansRecorded, submissionId } on success, throws on error.

  const WORKER_URL = 'https://kip-data.courtneyclive84.workers.dev/submit';
  const DEVICE_ID_KEY = 'kip_device_id';
  const LAST_SENT_KEY = 'kip_last_sent_at';

  function getDeviceId() {
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      id = 'dev_' + (crypto.randomUUID ? crypto.randomUUID() : Date.now() + '_' + Math.random().toString(36).slice(2));
      localStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  }

  function getLastSentAt() {
    return localStorage.getItem(LAST_SENT_KEY) || null;
  }

  async function sendToKiP() {
    const store = await tx('readonly');
    const all = await reqToPromise(store.getAll());
    if (all.length === 0) {
      return { ok: false, error: 'No scans to send' };
    }

    const payload = {
      deviceId:     getDeviceId(),
      appVersion:   'kip-pwa-2026.04',
      userProfile:  localStorage.getItem('kip_profile') || '',
      userLanguage: localStorage.getItem('kip_language') || 'en',
      scans: all.map(r => ({
        id:              r.id,
        timestamp:       r.timestamp,
        barcode:         r.barcode,
        productName:     r.productName,
        brand:           r.brand,
        trafficLight:    r.trafficLight,
        sugarTeaspoons:  r.sugarTeaspoons,
        saltSachets:     r.saltSachets,
        decision:        r.decision || null,
        userCondition:   r.userCondition,
        source:          r.source || null
      }))
    };

    const resp = await fetch(WORKER_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await resp.json().catch(() => ({}));
    if (!resp.ok || !data.ok) {
      throw new Error(data.error || ('HTTP ' + resp.status));
    }

    localStorage.setItem(LAST_SENT_KEY, data.submittedAt || new Date().toISOString());
    return data;
  }

  // ── Public API ──

  return {
    save,
    setDecision,
    getById,
    getAll,
    toggleFavourite,
    delete: deleteRecord,
    getStats,
    getImpact,
    exportJSON,
    clearAll,
    sendToKiP,
    getDeviceId,
    getLastSentAt,
    PAGE_SIZE
  };
})();
