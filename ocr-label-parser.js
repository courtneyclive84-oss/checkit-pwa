/*
 * ocr-label-parser.js
 * ------------------------------------------------------------------
 * Pure, side-effect-free parser for OCR'd UK nutrition panels.
 *
 * Input : an array of OCR line objects { text, confidence }
 *         (shape matches Tesseract.js `data.lines[]` — each line has
 *          `.text` and `.confidence` 0..100).
 * Output: an object keyed by canonical field name. Each field is
 *         { value, unit, basis, confidence, status, derived? }
 *         where status is "read" or "data_unavailable".
 *
 * GOVERNING RULE — Null-Value Safety Rule (clinically endorsed,
 * Dr Neel Basudev, 31 March 2026). This parser NEVER infers a value.
 * Anything it cannot read with high confidence is returned as
 * status:"data_unavailable" with value:null. It never substitutes 0,
 * blank, an estimate, or a rounded-toward-zero figure. A zero is
 * emitted ONLY when the panel explicitly reads zero at high confidence.
 *
 * This module is deliberately framework-free and has no DOM, network,
 * or storage dependencies so it can be unit-tested in isolation and
 * never writes anything to the shared database.
 * ------------------------------------------------------------------
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.OCRLabelParser = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Per-field OCR confidence gate. A line whose confidence is below this
  // threshold is treated as unreadable -> "data_unavailable".
  // PENDING CALIBRATION: 75 is a conservative placeholder. Tune against
  // a real-world sample of UK label photos before relying on it in
  // production. Raising it is safer (more "data_unavailable"); lowering
  // it risks surfacing misreads as if they were read values.
  var OCR_CONFIDENCE_THRESHOLD = 75;

  // ----------------------------------------------------------------
  // Low-level helpers
  // ----------------------------------------------------------------

  function normaliseLines(lines) {
    if (!Array.isArray(lines)) return [];
    return lines.map(function (l) {
      return {
        text: (l && l.text != null) ? String(l.text) : '',
        // Missing/non-numeric confidence is treated as 0 -> fails the
        // gate. We never assume a line is readable.
        confidence: (l && typeof l.confidence === 'number' && isFinite(l.confidence))
          ? l.confidence
          : 0
      };
    });
  }

  function normaliseUnit(u) {
    if (!u) return null;
    var t = u.toLowerCase();
    if (t === 'kcal') return 'kcal';
    if (t === 'kj') return 'kJ';
    if (t === 'mg') return 'mg';
    if (t === 'g') return 'g';
    if (t === 'ml') return 'ml';
    return null;
  }

  // Returns a field marked unreadable. basis is preserved so the UI can
  // still label/warn consistently.
  function naField(basis) {
    return {
      value: null,
      unit: null,
      basis: basis,
      confidence: null,
      status: 'data_unavailable'
    };
  }

  // Parse the first numeric token that appears in `s`, plus its unit.
  // Returns null when no number is present, or { ambiguous: true } when
  // the number is a bound/trace ("<0.5g", ">10g", "trace") that cannot
  // be turned into a definite value WITHOUT inference.
  function parseNumberUnit(s) {
    if (s == null) return null;
    var text = String(s);

    // Explicit "trace" wording -> ambiguous (no inference to a number).
    if (/\btrace\b/i.test(text)) return { ambiguous: true };

    var numRe = /(\d+(?:[.,]\d+)?)/;
    var m = text.match(numRe);
    if (!m) return null;

    var idx = m.index;
    // Inspect the character immediately preceding the number (ignoring
    // whitespace). A leading < or > means this is a bound, not a value.
    var prefix = text.slice(0, idx).replace(/\s+$/, '').slice(-1);
    if (prefix === '<' || prefix === '>') return { ambiguous: true };

    var value = parseFloat(m[1].replace(',', '.'));
    if (isNaN(value)) return null;

    var after = text.slice(idx + m[1].length);
    var unitMatch = after.match(/(kcal|kj|mg|ml|g)/i);
    var unit = unitMatch ? normaliseUnit(unitMatch[1]) : null;

    return { value: value, unit: unit, ambiguous: false };
  }

  // Find the first line matching `keywordRe`, skipping lines that match
  // `excludeRe` (used so "fat" doesn't accidentally grab "saturates").
  function findLine(lines, keywordRe, excludeRe) {
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      if (excludeRe && excludeRe.test(line.text)) continue;
      if (keywordRe.test(line.text)) return line;
    }
    return null;
  }

  // Extract the value that appears AFTER the anchor keyword within the
  // line text. This correctly handles combined lines such as
  // "Carbohydrate 30g of which sugars 12g" when anchored on /sugar/i.
  function extractAfterKeyword(text, anchorRe) {
    var m = text.match(anchorRe);
    if (!m) return null;
    return parseNumberUnit(text.slice(m.index + m[0].length));
  }

  // ----------------------------------------------------------------
  // Basis detection
  // ----------------------------------------------------------------
  //
  // - per_100g  : only a per-100g / per-100ml column is present
  // - per_serving : only a per-serving / per-portion column is present
  // - uncertain : both columns present (can't safely pick one) OR
  //               neither marker present. Per constraint #5 we NEVER
  //               assume per-100g; uncertainty is surfaced to the user.
  function detectBasis(lines) {
    var all = lines.map(function (l) { return l.text; }).join('  ').toLowerCase();

    var has100 = /(per\s*)?100\s*(g|ml)\b/.test(all) || /\/\s*100\s*(g|ml)\b/.test(all);
    var hasServing = /per\s*(serving|portion|pack)\b/.test(all) ||
                     /each\s*(serving|portion)\b/.test(all);

    if (has100 && hasServing) return 'uncertain';
    if (has100) return 'per_100g';
    if (hasServing) return 'per_serving';
    return 'uncertain';
  }

  // ----------------------------------------------------------------
  // Field builders
  // ----------------------------------------------------------------

  // Generic nutrient field. `lineRe` locates the row; `excludeRe`
  // rejects rows that would otherwise false-match; `anchorRe` (defaults
  // to lineRe) marks where the number begins within the row.
  function buildField(lines, lineRe, excludeRe, basis, anchorRe) {
    anchorRe = anchorRe || lineRe;
    var line = findLine(lines, lineRe, excludeRe);
    if (!line) return naField(basis);
    if (line.confidence < OCR_CONFIDENCE_THRESHOLD) return naField(basis);

    var parsed = extractAfterKeyword(line.text, anchorRe);
    if (!parsed || parsed.ambiguous || parsed.value == null) return naField(basis);

    return {
      value: parsed.value,
      unit: parsed.unit,
      basis: basis,
      confidence: line.confidence,
      status: 'read'
    };
  }

  // Energy line typically carries both kJ and kcal:
  // "Energy 1234kJ / 295kcal". `which` selects the unit to extract.
  function buildEnergyField(lines, which, basis) {
    var line = findLine(lines, /energ/i, null);
    if (!line || line.confidence < OCR_CONFIDENCE_THRESHOLD) return naField(basis);

    var re = which === 'kcal'
      ? /(\d+(?:[.,]\d+)?)\s*kcal/i
      : /(\d+(?:[.,]\d+)?)\s*kj/i;
    var m = line.text.match(re);
    if (!m) return naField(basis);

    return {
      value: parseFloat(m[1].replace(',', '.')),
      unit: which === 'kcal' ? 'kcal' : 'kJ',
      basis: basis,
      confidence: line.confidence,
      status: 'read'
    };
  }

  function buildServingField(lines) {
    var line = findLine(lines, /serving|portion/i, null);
    // Serving size has no per-basis itself; basis is null for this field.
    if (!line || line.confidence < OCR_CONFIDENCE_THRESHOLD) {
      return { value: null, unit: null, basis: null, confidence: null, status: 'data_unavailable' };
    }
    var parsed = parseNumberUnit(line.text);
    if (!parsed || parsed.ambiguous || parsed.value == null) {
      return { value: null, unit: null, basis: null, confidence: null, status: 'data_unavailable' };
    }
    return {
      value: parsed.value,
      unit: parsed.unit,
      basis: null,
      confidence: line.confidence,
      status: 'read'
    };
  }

  // Salt: use the salt row if read at high confidence. Otherwise derive
  // from sodium ONLY when sodium is high-confidence (salt = sodium x 2.5),
  // flagging derived:true. If neither is available -> data_unavailable.
  // Never invents a value.
  function buildSaltField(lines, basis) {
    var saltLine = findLine(lines, /salt/i, null);
    if (saltLine && saltLine.confidence >= OCR_CONFIDENCE_THRESHOLD) {
      var p = extractAfterKeyword(saltLine.text, /salt/i);
      if (p && !p.ambiguous && p.value != null) {
        return {
          value: p.value,
          unit: p.unit || 'g',
          basis: basis,
          confidence: saltLine.confidence,
          status: 'read',
          derived: false
        };
      }
    }

    var sodiumLine = findLine(lines, /sodium/i, null);
    if (sodiumLine && sodiumLine.confidence >= OCR_CONFIDENCE_THRESHOLD) {
      var s = extractAfterKeyword(sodiumLine.text, /sodium/i);
      if (s && !s.ambiguous && s.value != null) {
        // Convert sodium to grams first if expressed in mg.
        var sodiumG = (s.unit === 'mg') ? s.value / 1000 : s.value;
        // salt = sodium x 2.5 (defined regulatory conversion, not an
        // estimate). Round to 2dp only to remove IEEE float noise.
        var salt = Math.round(sodiumG * 2.5 * 100) / 100;
        return {
          value: salt,
          unit: 'g',
          basis: basis,
          confidence: sodiumLine.confidence,
          status: 'read',
          derived: true
        };
      }
    }

    var na = naField(basis);
    na.derived = false;
    return na;
  }

  function buildSodiumField(lines, basis) {
    return buildField(lines, /sodium/i, null, basis, /sodium/i);
  }

  // ----------------------------------------------------------------
  // Public entry point
  // ----------------------------------------------------------------

  function parseNutritionLabel(lines) {
    var norm = normaliseLines(lines);
    var basis = detectBasis(norm);

    return {
      basis: basis,
      serving_size: buildServingField(norm),
      energy_kj: buildEnergyField(norm, 'kj', basis),
      energy_kcal: buildEnergyField(norm, 'kcal', basis),
      // "fat" must not capture the "saturates" / "saturated fat" row.
      fat: buildField(norm, /fat/i, /satur/i, basis, /fat/i),
      saturates: buildField(norm, /satur/i, null, basis, /satur/i),
      carbohydrate: buildField(norm, /carbohydrate|carbs/i, null, basis, /carbohydrate|carbs/i),
      sugars: buildField(norm, /sugar/i, null, basis, /sugar/i),
      fibre: buildField(norm, /fibre|fiber/i, null, basis, /fibre|fiber/i),
      protein: buildField(norm, /protein/i, null, basis, /protein/i),
      sodium: buildSodiumField(norm, basis),
      salt: buildSaltField(norm, basis)
    };
  }

  return {
    parseNutritionLabel: parseNutritionLabel,
    OCR_CONFIDENCE_THRESHOLD: OCR_CONFIDENCE_THRESHOLD,
    // Exposed for unit testing of internals.
    _internal: {
      parseNumberUnit: parseNumberUnit,
      detectBasis: detectBasis,
      normaliseUnit: normaliseUnit
    }
  };
});
