/**
 * checkit-contribute — Cloudflare Worker
 * Path B: the USER contribution pipe. Receives a structured contribution from
 * the CheckIT PWA (macros already decoded by checkit-ocr + reviewed by the user)
 * and writes a row to the Airtable "SCANSMART I500" base, SKUs table.
 *
 * Auditor data still flows through the Tally SKU-Scan form, untouched. This pipe
 * is for the in-app user, and every row it writes is stamped
 *   Source Scope = "User contribution"
 * so crowd-grade rows stay filterable apart from verified auditor data.
 *
 * The Airtable Personal Access Token is a Worker secret: AIRTABLE_TOKEN
 *
 * Deploy:
 *   cd workers/checkit-contribute
 *   npx wrangler deploy
 *   npx wrangler secret put AIRTABLE_TOKEN   ← paste a PAT with data.records:write
 *                                              scoped to base appCuvm3csLUKo4tx
 */

const ALLOWED_ORIGINS = [
  'https://app.scansmart.uk',
  'http://localhost',
  'http://127.0.0.1',
];

// Not secret — these identify the base/table/field, they don't grant access.
const BASE_ID = 'appCuvm3csLUKo4tx';
const TABLE_ID = 'tblrDzfXWGjA77gck'; // SKUs
const PHOTO_FIELD_ID = 'fld0D2l6sPml1klsS'; // Photo (attachments)

const SOURCE_STAMP = 'User contribution';

function corsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.some(o => origin && origin.startsWith(o));
  return {
    'Access-Control-Allow-Origin': allowed ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

function jsonResponse(body, status, origin) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
  });
}

// Vision basis → Airtable singleSelect choice. We only set Basis when we are
// sure of it: an 'uncertain' read leaves the field blank rather than asserting
// a basis we could not actually read (an honest-figure-or-no-figure rule).
function mapBasis(basis) {
  if (basis === 'per_100g') return 'per 100g';
  if (basis === 'per_serving') return 'per serving';
  return null;
}

// Coerce to a finite number or null — never a string, never NaN.
function num(v) {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }
    if (request.method !== 'POST') {
      return jsonResponse({ error: 'Method not allowed' }, 405, origin);
    }
    if (!env.AIRTABLE_TOKEN) {
      return jsonResponse({ error: 'Worker not configured — AIRTABLE_TOKEN secret missing' }, 503, origin);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ error: 'Invalid JSON body' }, 400, origin);
    }

    // Build the SKUs record. Field NAMES match the live table exactly.
    // Only include a field when we actually have a value, so we never overwrite
    // with blanks or assert numbers we don't have.
    const fields = { 'Source Scope': SOURCE_STAMP };

    if (typeof body.barcode === 'string' && body.barcode.trim()) {
      fields['Barcode (EAN)'] = body.barcode.trim();
    }
    if (typeof body.product_name === 'string' && body.product_name.trim()) {
      fields['Product Name'] = body.product_name.trim();
    }
    if (typeof body.brand === 'string' && body.brand.trim()) {
      fields['Brand'] = body.brand.trim();
    }
    // Demand evidence for the Phase-2 language rollout — which language the
    // contributor had selected when they submitted (e.g. en, ur, pl).
    if (typeof body.user_language === 'string' && body.user_language.trim()) {
      fields['User Language'] = body.user_language.trim();
    }

    const sugars = num(body.sugars);
    const salt = num(body.salt);
    const saturates = num(body.saturates);
    const energy = num(body.energy_kcal);
    if (sugars !== null) fields['Sugars (g)'] = sugars;
    if (salt !== null) fields['Salt (g)'] = salt;
    if (saturates !== null) fields['Saturates (g)'] = saturates;
    if (energy !== null) fields['Energy (kcal)'] = energy;

    const basis = mapBasis(body.basis);
    if (basis) fields['Basis'] = basis;

    // ── 1. Create the record ──────────────────────────────────────────────
    let recordId;
    try {
      const res = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.AIRTABLE_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fields, typecast: false }),
      });
      if (!res.ok) {
        const detail = await res.text().catch(() => '');
        return jsonResponse({ error: 'Airtable create failed', status: res.status, detail }, 502, origin);
      }
      const data = await res.json();
      recordId = data.id;
    } catch (err) {
      return jsonResponse({ error: 'Airtable unreachable', detail: err.message }, 502, origin);
    }

    // ── 2. Attach the photo (best-effort) ─────────────────────────────────
    // The record already exists; a photo failure must not fail the whole write.
    // Airtable's content endpoint accepts base64 directly, so no R2 round-trip.
    let photoAttached = false;
    let photoError = null;
    if (body.photo && typeof body.photo.data === 'string') {
      try {
        const res = await fetch(
          `https://content.airtable.com/v0/${BASE_ID}/${recordId}/${PHOTO_FIELD_ID}/uploadAttachment`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${env.AIRTABLE_TOKEN}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contentType: body.photo.mediaType || 'image/jpeg',
              file: body.photo.data,
              filename: (body.barcode || 'label') + '.jpg',
            }),
          }
        );
        photoAttached = res.ok;
        if (!res.ok) photoError = await res.text().catch(() => '');
      } catch (err) {
        photoError = err.message;
      }
    }

    return jsonResponse({ ok: true, id: recordId, photoAttached, photoError }, 200, origin);
  },
};
