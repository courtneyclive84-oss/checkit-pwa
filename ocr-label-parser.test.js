/*
 * ocr-label-parser.test.js
 * ------------------------------------------------------------------
 * Zero-dependency unit tests. Run with:  node ocr-label-parser.test.js
 *
 * The over-arching invariant under test is the Null-Value Safety Rule:
 * no field may EVER be reported as 0 (or blank/null/estimate) unless the
 * panel explicitly read zero at high confidence. Unreadable -> the exact
 * status "data_unavailable" with value null.
 * ------------------------------------------------------------------
 */

var P = require('./ocr-label-parser.js');
var parse = P.parseNutritionLabel;
var THRESHOLD = P.OCR_CONFIDENCE_THRESHOLD;

var passed = 0;
var failed = 0;

function assert(cond, msg) {
  if (cond) {
    passed++;
  } else {
    failed++;
    console.error('  ✗ FAIL: ' + msg);
  }
}

function eq(a, b, msg) {
  assert(a === b, msg + '  (expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a) + ')');
}

function isUnavailable(field, label) {
  eq(field.status, 'data_unavailable', label + ' status');
  eq(field.value, null, label + ' value is null (never 0/blank)');
}

// Helper: assert NO field anywhere in the result was reported as 0 unless
// explicitly intended. Used by the fully-unreadable test.
function assertNoZeros(result, label) {
  Object.keys(result).forEach(function (k) {
    var f = result[k];
    if (f && typeof f === 'object' && 'value' in f) {
      assert(f.value !== 0, label + ': field "' + k + '" must not be 0 (got ' + f.value + ')');
    }
  });
}

var HI = THRESHOLD + 15;   // comfortably above the gate
var LO = THRESHOLD - 20;   // comfortably below the gate

// ==================================================================
// TEST 1 — clean per-100g panel: every field read, correct values/units
// ==================================================================
(function testCleanPanel() {
  console.log('TEST 1: clean per-100g panel');
  var lines = [
    { text: 'Nutrition Typical values per 100g', confidence: HI },
    { text: 'Energy 1850kJ / 440kcal', confidence: HI },
    { text: 'Fat 18.5g', confidence: HI },
    { text: 'of which saturates 9.2g', confidence: HI },
    { text: 'Carbohydrate 60.0g', confidence: HI },
    { text: 'of which sugars 35.0g', confidence: HI },
    { text: 'Fibre 2.1g', confidence: HI },
    { text: 'Protein 6.4g', confidence: HI },
    { text: 'Salt 0.75g', confidence: HI }
  ];
  var r = parse(lines);

  eq(r.basis, 'per_100g', 'basis');
  eq(r.energy_kcal.value, 440, 'energy kcal value');
  eq(r.energy_kcal.unit, 'kcal', 'energy kcal unit');
  eq(r.energy_kj.value, 1850, 'energy kJ value');
  eq(r.fat.value, 18.5, 'fat value');
  eq(r.fat.unit, 'g', 'fat unit');
  eq(r.saturates.value, 9.2, 'saturates value');
  eq(r.carbohydrate.value, 60.0, 'carbohydrate value');
  eq(r.sugars.value, 35.0, 'sugars value');           // not the carb number
  eq(r.fibre.value, 2.1, 'fibre value');
  eq(r.protein.value, 6.4, 'protein value');
  eq(r.salt.value, 0.75, 'salt value');
  eq(r.salt.derived, false, 'salt not derived');
  eq(r.fat.status, 'read', 'fat status read');
})();

// ==================================================================
// TEST 2 — one unreadable row: that field -> data_unavailable, rest read
// ==================================================================
(function testOneUnreadableRow() {
  console.log('TEST 2: one unreadable row');
  var lines = [
    { text: 'Typical values per 100g', confidence: HI },
    { text: 'Energy 1850kJ / 440kcal', confidence: HI },
    { text: 'Fat 18.5g', confidence: HI },
    { text: 'of which saturates 9.2g', confidence: LO },   // <- smudged row
    { text: 'Sugars 35.0g', confidence: HI },
    { text: 'Salt 0.75g', confidence: HI }
  ];
  var r = parse(lines);

  isUnavailable(r.saturates, 'saturates (low confidence)');
  eq(r.fat.value, 18.5, 'fat still read');
  eq(r.sugars.value, 35.0, 'sugars still read');
  eq(r.salt.value, 0.75, 'salt still read');
  // The unreadable row must NOT become zero.
  assert(r.saturates.value !== 0, 'saturates must not be 0');
})();

// ==================================================================
// TEST 3 — per-serving-only panel: values read, basis labelled per_serving
// ==================================================================
(function testPerServingOnly() {
  console.log('TEST 3: per-serving-only panel');
  var lines = [
    { text: 'Nutrition per serving (40g)', confidence: HI },
    { text: 'Energy 760kJ / 180kcal', confidence: HI },
    { text: 'Fat 7.4g', confidence: HI },
    { text: 'Sugars 14.0g', confidence: HI },
    { text: 'Salt 0.30g', confidence: HI }
  ];
  var r = parse(lines);

  eq(r.basis, 'per_serving', 'basis is per_serving');
  eq(r.sugars.value, 14.0, 'sugars value');
  eq(r.sugars.basis, 'per_serving', 'sugars carries per_serving basis');
  eq(r.serving_size.value, 40, 'serving size value');
  eq(r.serving_size.unit, 'g', 'serving size unit');
})();

// ==================================================================
// TEST 4 — sodium-only: salt derived (sodium x 2.5), flagged derived
// ==================================================================
(function testSodiumOnly() {
  console.log('TEST 4: sodium-only -> salt derived');
  var lines = [
    { text: 'Typical values per 100g', confidence: HI },
    { text: 'Energy 1850kJ / 440kcal', confidence: HI },
    { text: 'Sodium 0.4g', confidence: HI }
  ];
  var r = parse(lines);

  eq(r.salt.value, 1.0, 'salt derived = sodium*2.5');
  eq(r.salt.derived, true, 'salt flagged derived');
  eq(r.salt.unit, 'g', 'salt unit g');
  eq(r.sodium.value, 0.4, 'sodium read directly');

  // Derivation must NOT happen when sodium is low-confidence.
  var r2 = parse([
    { text: 'Typical values per 100g', confidence: HI },
    { text: 'Sodium 0.4g', confidence: LO }
  ]);
  isUnavailable(r2.salt, 'salt (low-confidence sodium, no derivation)');

  // mg sodium is converted to grams before x2.5.
  var r3 = parse([
    { text: 'per 100g', confidence: HI },
    { text: 'Sodium 400mg', confidence: HI }
  ]);
  eq(r3.salt.value, 1.0, 'salt from 400mg sodium = 1.0g');
  eq(r3.salt.derived, true, 'salt from mg flagged derived');
})();

// ==================================================================
// TEST 5 — fully unreadable: everything data_unavailable, NEVER zeros
// ==================================================================
(function testFullyUnreadable() {
  console.log('TEST 5: fully unreadable -> never zeros');
  var lines = [
    { text: 'Energy 1850kJ / 440kcal', confidence: LO },
    { text: 'Fat 18.5g', confidence: LO },
    { text: 'Sugars 35.0g', confidence: LO },
    { text: 'Salt 0.75g', confidence: LO },
    { text: 'Sodium 0.4g', confidence: LO }
  ];
  var r = parse(lines);

  isUnavailable(r.energy_kcal, 'energy_kcal');
  isUnavailable(r.energy_kj, 'energy_kj');
  isUnavailable(r.fat, 'fat');
  isUnavailable(r.sugars, 'sugars');
  isUnavailable(r.salt, 'salt');
  isUnavailable(r.sodium, 'sodium');
  assertNoZeros(r, 'fully unreadable');
})();

// ==================================================================
// EDGE — explicit high-confidence zero IS allowed to show as 0
// ==================================================================
(function testExplicitZero() {
  console.log('EDGE: explicit high-confidence zero');
  var r = parse([
    { text: 'per 100g', confidence: HI },
    { text: 'Sugars 0g', confidence: HI }
  ]);
  eq(r.sugars.value, 0, 'explicit zero is read as 0');
  eq(r.sugars.status, 'read', 'explicit zero status read');
})();

// ==================================================================
// EDGE — "<0.5g" trace bound must NOT be inferred to a number
// ==================================================================
(function testTraceBound() {
  console.log('EDGE: trace / less-than bound -> data_unavailable');
  var r = parse([
    { text: 'per 100g', confidence: HI },
    { text: 'Salt <0.5g', confidence: HI },
    { text: 'Fibre trace', confidence: HI }
  ]);
  isUnavailable(r.salt, 'salt "<0.5g" (no inference to 0.5)');
  isUnavailable(r.fibre, 'fibre "trace" (no inference)');
  assert(r.salt.value !== 0.5, 'salt must not become 0.5');
})();

// ==================================================================
// EDGE — both columns present -> basis uncertain (never assume per_100g)
// ==================================================================
(function testDualColumnUncertain() {
  console.log('EDGE: dual-column -> basis uncertain');
  var r = parse([
    { text: 'Typical values per 100g per serving', confidence: HI },
    { text: 'Sugars 35.0g 14.0g', confidence: HI }
  ]);
  eq(r.basis, 'uncertain', 'dual column basis uncertain');
  // No basis marker at all is also uncertain.
  var r2 = parse([{ text: 'Sugars 35.0g', confidence: HI }]);
  eq(r2.basis, 'uncertain', 'no marker basis uncertain');
})();

// ==================================================================
// EDGE — European decimal comma parses correctly
// ==================================================================
(function testDecimalComma() {
  console.log('EDGE: decimal comma');
  var r = parse([
    { text: 'per 100g', confidence: HI },
    { text: 'Fat 18,5g', confidence: HI }
  ]);
  eq(r.fat.value, 18.5, 'comma decimal -> 18.5');
})();

// ==================================================================
// EDGE — missing confidence is treated as unreadable (fail-safe)
// ==================================================================
(function testMissingConfidence() {
  console.log('EDGE: missing confidence -> data_unavailable');
  var r = parse([
    { text: 'per 100g' },
    { text: 'Sugars 35.0g' }   // no confidence field at all
  ]);
  isUnavailable(r.sugars, 'sugars with no confidence');
})();

// ------------------------------------------------------------------
console.log('\n----------------------------------------');
console.log('PASSED: ' + passed + '   FAILED: ' + failed);
console.log('----------------------------------------');
if (failed > 0) {
  process.exit(1);
}
