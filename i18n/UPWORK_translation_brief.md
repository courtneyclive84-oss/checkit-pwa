# Upwork job brief — Urdu + Polish review of CheckIT app strings (DRAFT, for Ras to post)

> Two routes: hire **one bilingual reviewer** (rare) **or two separate hires** (one Urdu, one Polish). The worksheet has separate columns for each, so either works.

---

**Title:** Native Urdu / Polish reviewer for a UK food-health app (review machine-draft translations)

**Category:** Translation → Translation & Localization · Fixed-price · ~296 short UI strings

**Project description:**

We're a UK food-literacy app (CheckIT — helps shoppers understand sugar/salt/additives on food labels). We have machine-generated **draft** translations into **Urdu** and **Polish** and need a **native speaker to review and correct** them — not translate from scratch.

You'll work in a single spreadsheet (CSV, UTF-8). For each row you'll see: the English source, the draft translation, and a blank "final" column. Where the draft is good, confirm it; where it's off, correct it.

**Critical requirements:**
1. **Native fluency** in the target language (Urdu and/or Polish), **UK context** preferred.
2. **~34 rows are health claims** (NHS guidance, sugar/salt thresholds, vitamin advice) flagged `HEALTH-CHECK` — these must be **accurate and not soften or change any numbers**. Comfort with nutrition/health copy is important.
3. **Preserve exactly, do not alter:** any `{placeholder}` token (e.g. `{sugar}`, `{count}`), any HTML/SVG markup (`<strong>…</strong>`, `<svg>…</svg>`), and the do-not-translate brand terms (CheckIT, KiP, SaK, Dr RooT, SCANSMART, I500, NHS, FSA, EFSA) — these are marked `keep-verbatim`.
4. **Voice:** the app characters (KiP, SaK, Dr RooT) are warm, plain-spoken, no jargon, no judgement. Keep that register; keep "KiP! KiP!" verbatim.

**Deliverable:** the same CSV with the `*_final` column completed for your language(s).

**To apply:** tell us your native language(s), any nutrition/health-translation experience, and translate this one sample for us:
> *"Sugar is high at 12.5g per 100g. The NHS recommends adults have no more than 30g of free sugars per day — about 7.5 teaspoons."*
(Keep the numbers and units exactly.)

**Files we'll share on hire:** `REVIEW_worksheet.csv` (the 296-row worksheet).

---

### Internal notes (not for the post)
- Source worksheet: `i18n/REVIEW_worksheet.csv` (key · kind · flag · english · urdu_draft · urdu_final · polish_draft · polish_final · notes).
- On return: I promote the `*_final` columns into `i18n.js` (`ur`/`pl` dicts) — mechanical, minutes. Then RTL device-test (Urdu).
- §50/§56 gate: drafts stay out of the live dicts until this review is back.
