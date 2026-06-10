
/* ============================================================================
   CheckIT i18n scaffold  (generated from i18n/catalogue.en.json)
   --------------------------------------------------------------------------
   EN is the source of truth. `ur` and `pl` are intentionally EMPTY until a
   native reviewer signs off the translations (health copy + KiP voice must not
   ship machine-translated — §50/§56). Any missing key falls back to English,
   so the app runs exactly as today in every language until translations land.

   Two consumers:
     - Static markup:  <span data-i18n="key">English</span>            (DOM walk)
                       <input data-i18n-attr="placeholder:key">        (attrs)
                       data-i18n-html on elements whose copy has inline markup
     - Dynamic JS:     t('key', { param: value })                      (lookup)
   ========================================================================== */
(function (w) {
  w.I18N_META = { available: ['en', 'ur', 'pl'], rtl: ['ur'], default: 'en' };

  // Active language; resolved on load from localStorage, default 'en'.
  w.__lang = 'en';

  // t(key, params) — dictionary lookup with {param} interpolation + EN fallback.
  w.t = function (key, params) {
    var dict = w.I18N[w.__lang] || w.I18N.en;
    var s = dict[key];
    if (s == null) s = (w.I18N.en[key] != null ? w.I18N.en[key] : key); // fallback
    if (params) {
      s = s.replace(/\{(\w+)\}/g, function (m, p) {
        return params[p] != null ? params[p] : m;
      });
    }
    return s;
  };

  // applyTranslations(root) — walk static markup and fill from the dictionary.
  // Set an element's text WITHOUT disturbing sibling elements (e.g. an inline
  // <svg> icon next to a label). Pure-text elements get textContent; mixed
  // elements get their last non-empty text node rewritten, preserving the icon
  // and the original leading/trailing whitespace.
  function setText(el, str) {
    if (el.childElementCount === 0) { el.textContent = str; return; }
    var nodes = el.childNodes, target = null;
    for (var i = 0; i < nodes.length; i++) {
      if (nodes[i].nodeType === 3 && nodes[i].nodeValue.trim()) target = nodes[i];
    }
    if (target) {
      var lead = (target.nodeValue.match(/^\s*/) || [''])[0];
      var trail = (target.nodeValue.match(/\s*$/) || [''])[0];
      target.nodeValue = lead + str + trail;
    } else {
      el.appendChild(document.createTextNode(str));
    }
  }

  w.applyTranslations = function (root) {
    root = root || document;
    var lang = w.__lang;
    // English is the authored source of truth — never overwrite it. And only
    // touch a node when the ACTIVE language has its OWN entry for that key;
    // untranslated keys stay exactly as authored (no paraphrase, no churn).
    if (lang === 'en') return;
    var dict = w.I18N[lang] || {};
    var nodes = root.querySelectorAll('[data-i18n]');
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i], key = el.getAttribute('data-i18n');
      if (!(key in dict)) continue;
      if (el.hasAttribute('data-i18n-html')) el.innerHTML = dict[key];
      else setText(el, dict[key]);
    }
    var attrNodes = root.querySelectorAll('[data-i18n-attr]');
    for (var j = 0; j < attrNodes.length; j++) {
      var ae = attrNodes[j];
      ae.getAttribute('data-i18n-attr').split(';').forEach(function (pair) {
        var idx = pair.indexOf(':');
        if (idx < 0) return;
        var k = pair.slice(idx + 1).trim();
        if (k in dict) ae.setAttribute(pair.slice(0, idx).trim(), dict[k]);
      });
    }
  };

  // setLanguage(lang) — switch language, flip dir for RTL, persist, re-render.
  w.setLanguage = function (lang) {
    if (!w.I18N[lang]) lang = 'en';
    w.__lang = lang;
    var rtl = w.I18N_META.rtl.indexOf(lang) >= 0;
    document.documentElement.lang = lang;
    document.documentElement.dir = rtl ? 'rtl' : 'ltr';
    try { localStorage.setItem('kip_language', lang); } catch (e) {}
    w.applyTranslations(document);
  };

  // On load, adopt any saved language (after the dict below is assigned).
  w.initLanguage = function () {
    var saved;
    try { saved = localStorage.getItem('kip_language'); } catch (e) {}
    w.setLanguage(saved && w.I18N[saved] ? saved : 'en');
  };
})(window);

window.I18N = {
  en: {
  "app.title": "CheckIT — SCANSMART",
  "splash.hero.alt": "The CheckIT Crew — KiP, SaK, and Dr RooT",
  "splash.brandmark": "SCANSMART",
  "splash.wordmark": "<span class=\"checkit-check\">Check</span><span class=\"checkit-it\">IT</span>",
  "splash.tagline": "For people who want to know what's really in their food.",
  "splash.crew.intro": "Hi, we are the <span class=\"checkit-em\">Check</span>IT Crew — KiP, SaK, and Dr RooT. We read what's behind the barcode for you.",
  "splash.cta.start": "Let's go",
  "splash.disclaimer": "Food literacy tool. Not medical advice.",
  "lang.char.name": "KiP",
  "lang.prompt": "Which language works best for you?",
  "lang.option.en": "English",
  "lang.option.ur": "اردو (Urdu)",
  "lang.cta.continue": "Continue",
  "profile.heading": "What are you checking?",
  "profile.card.sugar": "Sugar",
  "profile.card.salt": "Salt",
  "profile.card.caffeine": "Caffeine",
  "profile.card.general": "General",
  "profile.cta.confirm": "That's me",
  "profile.haptic.label": "📳 Haptic feedback",
  "onboard.sak.kipsays": "KiP says...",
  "onboard.sak.intro": "Meet <strong>SaK</strong>. Scan and Know. Point your camera at any barcode and SaK will tell you what's really inside.",
  "onboard.sak.name": "SaK - Scan and Know",
  "onboard.sak.bubble": "KiP! KiP! Ready to scan. Point me at a barcode and I'll tell you what's really in there.",
  "onboard.sak.cta.gotit": "Got it",
  "onboard.sak.cta.skip": "Skip",
  "onboard.drroot.intro": "And this is <strong>Dr RooT</strong>. The brains behind the operation. When you want to understand why something matters for your health, RooT has the answers. No jargon. No judgement. Just the truth.",
  "onboard.drroot.name": "Dr RooT - Food Knowledge Guide",
  "onboard.drroot.bubble": "I'll show you what the numbers mean and why they matter. Tap my detail screen any time you want to go deeper.",
  "onboard.drroot.cta.scan": "Let's scan",
  "onboard.firstscan.bubble": "Let's try it. Grab something from your cupboard and scan it. This is your first step to knowing what's really in your food.",
  "onboard.firstscan.cta": "Scan my first product",
  "scanner.stats.btn": "<svg viewBox=\"0 0 24 24\" width=\"16\" height=\"16\" xmlns=\"http://www.w3.org/2000/svg\"><rect x=\"3\" y=\"14\" width=\"4\" height=\"7\" rx=\"1\" fill=\"#2D9B6F\"/><rect x=\"10\" y=\"9\" width=\"4\" height=\"12\" rx=\"1\" fill=\"#F5A623\"/><rect x=\"17\" y=\"5\" width=\"4\" height=\"16\" rx=\"1\" fill=\"#2D9B6F\"/></svg> Stats",
  "scanner.history.btn": "<svg viewBox=\"0 0 24 24\" width=\"16\" height=\"16\" fill=\"none\" stroke=\"#2D9B6F\" stroke-width=\"2.5\" stroke-linecap=\"round\"><path d=\"M12 8v4l3 3\"/><circle cx=\"12\" cy=\"12\" r=\"9\"/></svg> History",
  "scanner.play.btn": "<svg viewBox=\"0 0 24 24\" width=\"16\" height=\"16\" fill=\"none\" stroke=\"#F5A623\" stroke-width=\"2\" stroke-linecap=\"round\"><rect x=\"4\" y=\"4\" width=\"16\" height=\"16\" rx=\"3\"/><polygon points=\"10,8 16,12 10,16\" fill=\"#F5A623\" stroke=\"none\"/></svg> Play",
  "scanner.website.btn": "<svg viewBox=\"0 0 24 24\" width=\"16\" height=\"16\" fill=\"none\" stroke=\"#2D9B6F\" stroke-width=\"2\" stroke-linecap=\"round\"><circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M3 12h18\"/><path d=\"M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18\"/></svg> Website",
  "scanner.tracker.sugar.val": "{current}g / {limit}g",
  "scanner.sak.name": "SaK",
  "scanner.sak.prompt": "KiP! KiP! Point me at a barcode. I'll read it instantly.",
  "scanner.tapstart.cta": "Tap to Start Camera",
  "scanner.tapstart.hint": "iOS needs a direct tap to enable camera. When prompted, choose <b>Allow</b>.",
  "scanner.hint": "Hold your camera steady over any food product barcode",
  "scanner.manualentry.btn": "Type barcode manually instead",
  "scanner.photolabel.btn": "📷 No barcode? Photograph the label",
  "scanner.retrycamera.btn": "Retry camera",
  "result.product.name.default": "Product Name",
  "detail.char.name": "Dr RooT",
  "detail.header.sub": "Full nutritional breakdown",
  "scanner.taptostart.emoji": "📷",
  "result.back.aria": "←",
  "stats.title": "Weekly Summary",
  "manual.title": "Enter Barcode",
  "manual.sub": "Type or paste the barcode number from the product packaging. Usually 8 or 13 digits.",
  "manual.input.placeholder": "e.g. 5000169021532",
  "manual.btn.cancel": "Cancel",
  "manual.btn.scan": "Scan it",
  "contribute.title": "Add to the I500",
  "contribute.sub": "This product isn't in the I500 database yet. Add the key nutrition values from the label and it's there for every CheckIT user who scans this barcode next.",
  "contribute.field.name.label": "Product name",
  "contribute.field.name.placeholder": "e.g. Brand Biscuits",
  "contribute.field.brand.label": "Brand",
  "contribute.field.brand.placeholder": "e.g. McVitie's",
  "contribute.field.sugar.label": "Sugar (g per 100g)",
  "contribute.field.sugar.placeholder": "e.g. 12.5",
  "contribute.field.salt.label": "Salt (g per 100g)",
  "contribute.field.salt.placeholder": "e.g. 0.8",
  "contribute.field.satfat.label": "Saturated fat (g per 100g)",
  "contribute.field.satfat.placeholder": "e.g. 3.2",
  "contribute.field.kcal.label": "Energy (kcal per 100g)",
  "contribute.field.kcal.placeholder": "e.g. 420",
  "contribute.photo.label": "Or photograph the label",
  "contribute.photo.btn": "Open camera for label photo",
  "contribute.photo.captured": "Photo captured",
  "contribute.disclaimer": "This goes to <strong style=\"color:var(--emerald)\">KiP's I500 database</strong> &mdash; our own label-verified dataset for products the mainstream apps miss. Your contribution helps other shoppers in your community. It doesn't go to Open Food Facts.",
  "contribute.btn.save": "Save",
  "loading.text": "Looking up product...",
  "scanner.tracker.sugar.default": "0g / 30g",
  "scanner.tracker.salt.default": "0g / 6g",
  "privacy.status.off": "Sharing is OFF.",
  "privacy.status.on": "Sharing buying choices only — not personal data.",
  "privacy.firstScan.disclaimer": "We collect your buying choices, not your personal data. Tap Buy, Put back, or Just looking and KiP sends that tap to ScanSmart with the barcode and traffic-light reading. No name, no location, nothing that identifies you. Turn off in Settings → Privacy.",
  "privacy.footer.shareLabel": "Share",
  "additive.result.summary": "Dr RooT found {count} E number{plural} in this product.",
  "additive.result.summary.redCount": " {redCount} flagged red.",
  "additive.result.summary.profileRelevant": " {count} relevant to your profile.",
  "additive.result.warning.title": "E Numbers Detected",
  "additive.result.warning.cta": "{msg} Tap \"Dr RooT - explain this to me\" for the full breakdown.",
  "additive.risk.label.red": "Avoid if possible",
  "additive.risk.label.amber": "Worth knowing",
  "additive.risk.label.green": "No concern",
  "additive.card.profileFlag": "Relevant to your {profileName} profile",
  "additive.decoder.summary": "{count} E number{plural} found: {breakdown}.",
  "additive.decoder.summary.count.red": "{redCount} red",
  "additive.decoder.summary.count.amber": "{amberCount} amber",
  "additive.decoder.summary.count.green": "{greenCount} green",
  "additive.decoder.summary.profileFlag": " {count} flagged for your {profileName} profile.",
  "additive.decoder.header.title": "E Numbers Decoded",
  "detail.salt.dataUnavailable": "Data unavailable",
  "detail.salt.perLabel": "{salt}g salt per 100g",
  "detail.level.high": "HIGH",
  "detail.level.medium": "MEDIUM",
  "detail.level.low": "LOW",
  "detail.salt.sachetEquiv": "Each sachet = approximately 0.3g salt",
  "detail.sugar.perLabel": "{sugar}g sugar per 100g",
  "detail.sugar.spoonEquiv": "Each spoon = 4g sugar (1 teaspoon)",
  "scanner.status.requesting": "Requesting camera access...",
  "scanner.error.blocked": "Camera blocked. On iOS: Settings → Safari → Camera → Allow. Then reload.",
  "scanner.error.notFound": "No camera found on this device.",
  "scanner.error.notSupported": "Camera not supported. Make sure you are using HTTPS.",
  "scanner.error.unavailable": "Camera unavailable: {detail}",
  "scanner.error.playbackBlocked": "Video playback blocked. Tap to resume.",
  "scanner.status.barcodeDetected": "Barcode: {code}",
  "scanner.status.loadingDecoder": "Loading decoder...",
  "scanner.error.decoderFailed": "Decoder failed to load. Use manual entry.",
  "scanner.status.barcodePrefix": "Barcode: {barcode}",
  "scanner.status.cameraUnavailable": "Camera unavailable. Use manual entry below.",
  "lookup.error.network": "Network error. Check your connection and try again.",
  "detail.sugarDetective.title": "KiP's Sugar Detective",
  "detail.sugarDetective.body": "The label for {productName} may seem straightforward. But I found: {aliasList}. That's {count} {kindOrKinds} of sugar hiding in plain sight. Now you",
  "detail.sugarDetective.kindSingular": "kind",
  "detail.sugarDetective.kindPlural": "kinds",
  "alternatives.card.stat": "{value}g {nutrient} per 100g",
  "alternatives.header.text": "KiP! KiP! This one's high in {nutrient}. But I've found something better.",
  "nutrient.label.sugar": "sugar",
  "nutrient.label.salt": "salt",
  "detail.sugar.detective_body": "The label for {productName} may seem straightforward. But I found: {aliasList}. That's {count} {kindOrKinds} of sugar hiding in plain sight. Now you know.",
  "detail.product.fallback_name": "This product",
  "stats.todaysLog.label": "Today's Log",
  "stats.sugar.summary": "Sugar: {sugar}g of {limit}g limit ({pct}%)",
  "stats.salt.summary": "Salt: {salt}g of {limit}g limit ({pct}%)",
  "stats.items.scannedToday": "{count} {itemWord} scanned today",
  "stats.items.singular": "item",
  "stats.items.plural": "items",
  "stats.itemsToday.label": "Items today",
  "stats.item.nutrients": "Sugar: {sugar}g | Salt: {salt}g",
  "stats.thisWeek.label": "This Week",
  "stats.table.header.date": "Date",
  "stats.table.header.items": "Items",
  "result.name.withBrand": "{name} - {brand}",
  "result.product.unknownName": "Unknown Product",
  "result.alt.spinner.searching": "Looking for better alternatives...",
  "result.i500.badge.title": "From the I500",
  "result.i500.badge.verified": "{id} &middot; Label-verified",
  "result.i500.badge.notInOFF": " · Not in Open Food Facts",
  "result.verdict.kipSays.prefix": "KiP says: ",
  "result.verdict.green": "Good to go",
  "result.verdict.amber": "One thing to know",
  "result.verdict.red": "High - check this one",
  "result.section.per100g": "Per 100g",
  "result.nutriCard.fat": "Fat",
  "result.nutriCard.satFat": "Sat Fat",
  "result.decision.prompt": "What will you do with this?",
  "result.decision.buy": "Buy",
  "result.decision.buy.sub": "goes in basket",
  "result.decision.putBack": "Put back",
  "result.decision.putBack.sub": "KiP saved you",
  "result.decision.justLooking": "Just looking",
  "result.decision.justLooking.sub": "no decision",
  "result.btn.drRootExplain": "Dr RooT - explain this to me",
  "result.btn.scanNext": "Scan next",
  "result.btn.done": "Done",
  "result.disclaimer.dataSource": "Data from Open Food Facts. Not medical advice.",
  "result.disclaimer.profileActive": "{profile} profile active",
  "result.decision.toast.buy": "Added to today",
  "result.decision.toast.putBack": "Noted: put back",
  "result.decision.toast.viewed": "Noted: just looking",
  "result.nova.label.1": "Unprocessed",
  "result.nova.label.2": "Processed ingredients",
  "result.nova.label.3": "Processed",
  "result.nova.label.4": "Ultra-processed",
  "result.nutriScore.title": "Nutri-Score",
  "result.nova.title": "NOVA Group",
  "result.nova.label.unknown": "Unknown",
  "result.nutriCard.value.unknown": "?",
  "result.nutriCard.dataUnavailable": "data unavailable",
  "result.verdict.green.diabetes": "{name} looks fine for sugar. Green across the board for your profile.",
  "result.verdict.green.hypertension": "{name} is low in salt. Good choice for your blood pressure.",
  "result.verdict.green.default": "{name} looks fine. Green on the key nutrients for your profile.",
  "result.verdict.amber.2": "{name} has something worth knowing. Check the numbers below before you decide.",
  "result.verdict.red.2": "{name} is high in {items}. Worth looking at the alternatives.",
  "result.sak.alert.title": "KiP! KiP! High alert.",
  "result.sak.alert.body": "This one's flagged: {items}. That's above what I'd want to see for your profile. Check own-brand or community alternatives.",
  "notfound.heading.incomplete": "Not enough label info",
  "notfound.heading.notInDb": "Product Not Found",
  "notfound.banner.incomplete.strong": "KiP found this product, but key values are missing",
  "notfound.banner.notInDb.strong": "KiP couldn't find barcode {barcode}",
  "notfound.banner.incomplete.body": "The sugar or salt figures aren't recorded, so KiP can't give you a read. Photograph the label and KiP will read it for you.",
  "notfound.banner.notInDb.body": "This product isn't in the Open Food Facts database yet. You can help by adding it.",
  "notfound.bubble.incomplete": "KiP! KiP! I found it, but I'm missing the numbers that matter. Show me the label.",
  "notfound.bubble.notInDb": "KiP! KiP! I can't find this one yet. But you can help fill the gap.",
  "notfound.btn.photographLabel": "Photograph the label",
  "notfound.btn.enterManually": "Enter values manually",
  "contribute.save.btn.submitPhoto": "Submit photo",
  "result.value.tracker.sugar": "{sugar}g / {limit}g",
  "result.value.tracker.salt": "{salt}g / {limit}g",
  "detail.row.energy": "Energy",
  "detail.row.energyKj": "Energy (kJ)",
  "detail.row.fatTotal": "Fat (total)",
  "detail.row.saturatedFat": "Saturated fat",
  "detail.row.transFat": "Trans fat",
  "detail.row.cholesterol": "Cholesterol",
  "detail.row.carbohydrates": "Carbohydrates",
  "detail.row.ofWhichSugars": "of which sugars",
  "detail.row.fibre": "Fibre",
  "detail.row.protein": "Protein",
  "detail.row.sodium": "Sodium",
  "detail.row.calcium": "Calcium",
  "detail.row.iron": "Iron",
  "detail.row.vitaminD": "Vitamin D",
  "detail.row.vitaminC": "Vitamin C",
  "detail.row.vitaminA": "Vitamin A",
  "detail.ingredients.label": "Ingredients",
  "detail.section.fullNutritionalData": "Full Nutritional Data - per 100g",
  "detail.table.header.nutrient": "Nutrient",
  "detail.trafficLight.legend": "Red = high. Amber = medium. Green = low. Based on FSA thresholds{profileSuffix}.",
  "detail.trafficLight.legend.profileSuffix": " adjusted for your {profileLabel} profile",
  "detail.source.disclaimer": "Source: Open Food Facts. Data may vary. Always check the physical label. Not medical advice.",
  "detail.allergens.label": "Allergens:",
  "detail.drroot.salt.red.hypertension": "Salt is high at {salt}g per 100g. For hypertension, the NHS recommends no more than 6g of salt per day. Reducing salt intake can lower systolic blood pressure by up to 5mmHg.",
  "detail.drroot.salt.red.general": "Salt is high at {salt}g per 100g. The NHS recommends adults eat no more than 6g of salt per day. Too much salt raises blood pressure, which increases risk of stroke and heart disease.",
  "detail.drroot.salt.amber": "Salt is {salt}g per 100g, which is medium. The NHS recommends adults eat no more than 6g of salt per day. Worth keeping an eye on your total daily intake.",
  "detail.drroot.salt.green": "Salt is low at {salt}g per 100g. Good choice for keeping sodium in check.",
  "detail.drroot.sugar.red.diabetes": "Sugar is high at {sugar}g per 100g. For people managing Type 2 diabetes, reducing sugar intake helps with blood glucose control. Research shows every 10% increase in ultra-processed food consumption links to a 17% increase in T2D risk.",
  "detail.drroot.sugar.red.general": "Sugar is high at {sugar}g per 100g. The NHS recommends adults have no more than 30g of free sugars per day. That is roughly 7.5 teaspoons.",
  "detail.drroot.sugar.amber": "Sugar is {sugar}g per 100g, which is medium. The NHS recommends no more than 30g of free sugars per day (about 7.5 teaspoons). Factor this into your daily total.",
  "detail.drroot.sugar.green": "Sugar is low at {sugar}g per 100g. This is well within healthy limits.",
  "detail.drroot.fat.red": "Total fat is high at {fat}g per 100g. The NHS recommends adults have no more than 70g of fat per day.",
  "detail.drroot.fat.amber": "Total fat is {fat}g per 100g, which is medium. Keep an eye on your total daily fat intake.",
  "detail.drroot.fat.green": "Total fat is low at {fat}g per 100g.",
  "detail.drroot.satfat.red": "Saturated fat is high at {satFat}g per 100g. The NHS recommends men eat no more than 30g and women no more than 20g of saturated fat per day. Too much saturated fat raises LDL cholesterol.",
  "detail.drroot.satfat.amber": "Saturated fat is {satFat}g per 100g, which is medium. Saturated fat raises LDL cholesterol, so worth watching your daily total.",
  "detail.drroot.satfat.green": "Saturated fat is low at {satFat}g per 100g. Good for heart health.",
  "detail.drroot.carbs.base": "Carbohydrates: {carbs}g per 100g.",
  "detail.drroot.carbs.diabetesSuffix": " For people managing diabetes, tracking carbohydrate intake is important as carbs have the most direct impact on blood glucose levels.",
  "detail.drroot.protein": "Protein: {protein}g per 100g. The NHS recommends about 50g of protein per day for adults.",
  "detail.drroot.fibre": "Fibre: {fibre}g per 100g. The NHS recommends 30g of fibre per day. Most adults in the UK only get about 18g.",
  "detail.drroot.fibre.goodSourceSuffix": " This is a good source of fibre.",
  "detail.drroot.energy": "Energy: {energy} kcal per 100g. The daily reference intake is around 2,000 kcal for women and 2,500 kcal for men.",
  "detail.drroot.transfat.high": "Trans fat: {transFat}g per 100g. The WHO recommends limiting trans fat to less than 1% of total energy intake. Trans fats raise LDL (\"bad\") cholesterol and lower HDL (\"good\") cholesterol, increasing heart disease risk.",
  "detail.drroot.transfat.low": "Trans fat: {transFat}g per 100g. Low level, but the WHO recommends eliminating industrially produced trans fats from the food supply entirely.",
  "detail.drroot.transfat.none": "Trans fat: none detected. Good — trans fats are the most harmful type of dietary fat.",
  "detail.drroot.cholesterol.high": "Cholesterol: {cholMg}mg per 100g. This is relatively high. While dietary cholesterol has less impact than previously thought, the NHS still recommends keeping intake moderate, especially if you have heart disease or high cholesterol.",
  "detail.drroot.cholesterol.normal": "Cholesterol: {cholMg}mg per 100g.",
  "detail.drroot.sodium": "Sodium: {sodiumMg}mg per 100g (salt = sodium × 2.5). The NHS recommends no more than 2,400mg sodium per day.",
  "detail.drroot.sodium.hypertensionSuffix": " For hypertension, lower is better — aim for under 1,500mg per day.",
  "detail.drroot.calcium": "Calcium: {caMg}mg per 100g. Adults need 700mg per day for healthy bones and teeth.",
  "detail.drroot.calcium.goodSourceSuffix": " This is a good source of calcium.",
  "detail.drroot.iron": "Iron: {feMg}mg per 100g. Men need 8.7mg per day, women (19-50) need 14.8mg per day.",
  "detail.drroot.iron.usefulSourceSuffix": " This is a useful source of iron.",
  "detail.drroot.vitaminD": "Vitamin D: {vdUg}µg per 100g. The NHS recommends 10µg per day for everyone. Most people in the UK don't get enough, especially in winter.",
  "detail.drroot.vitaminD.contributesSuffix": " This contributes meaningfully to your daily intake.",
  "detail.drroot.vitaminC": "Vitamin C: {vcMg}mg per 100g. Adults need 40mg per day. Vitamin C supports the immune system and helps the body absorb iron.",
  "detail.drroot.vitaminC.goodSourceSuffix": " Good source.",
  "detail.nutriscore.label.a": "Excellent",
  "detail.nutriscore.label.b": "Good",
  "detail.nutriscore.label.c": "Average",
  "detail.nutriscore.label.d": "Poor",
  "detail.nutriscore.label.e": "Bad",
  "detail.nutriscore.advice.a": "This product scores well overall for nutritional quality.",
  "detail.nutriscore.advice.b": "A reasonable choice. Could be eaten regularly as part of a balanced diet.",
  "detail.nutriscore.advice.c": "Moderate nutritional quality. Fine occasionally but check the details.",
  "detail.nutriscore.advice.d": "Poor nutritional quality overall. Worth looking for alternatives.",
  "detail.nutriscore.advice.e": "Very poor nutritional quality. Best kept as an occasional treat, not a regular choice.",
  "detail.nutriscore.sentence": "Nutri-Score {grade} ({label}). {advice} Nutri-Score is calculated from energy, sugar, saturated fat, sodium, fibre, protein, and fruit/veg content.",
  "detail.nova.desc.1": "Unprocessed or minimally processed food. These are the healthiest choices — whole foods with nothing added.",
  "detail.nova.desc.2": "Processed culinary ingredients (oils, butter, sugar, salt). Used in cooking rather than eaten alone.",
  "detail.nova.desc.3": "Processed food. Made by adding salt, oil, sugar or other substances to Group 1 foods. Examples: tinned vegetables, cheese, bread.",
  "detail.nova.desc.4": "Ultra-processed food. Industrial formulations with additives like emulsifiers, flavourings, and colours. Research links high ultra-processed food intake to obesity, Type 2 diabetes, and cardiovascular disease.",
  "detail.nova.sentence": "NOVA Group {nova}: {desc}",
  "detail.nova.diabetesSuffix": " For people managing diabetes, reducing ultra-processed food intake is particularly important — studies show a 17% increase in T2D risk for every 10% increase in ultra-processed food consumption.",
  "detail.drroot.hiddenSodium": "Hidden sodium detected: {aliases}. These additives contribute to your overall sodium intake and may not be fully reflected in the salt figure on the label.",
  "detail.drroot.attribution": "Dr RooT says",
  "contribute.photo.previewCaptured": "Photo captured: {filename}",
  "contribute.success.bannerStrong": "Added to the I500",
  "contribute.success.bannerBody": "Your contribution is in the queue. Next time anyone scans this barcode, the data's there.",
  "contribute.success.bubble": "You've just helped close a gap that the mainstream apps leave open. Thank you.",
  "contribute.success.btn.viewDetails": "View product details",
  "error.title": "Error",
  "error.try_again": "Try again",
  "error.message": "{msg}",
  "ocr.basis.per_100g": "per 100g",
  "ocr.basis.per_serving": "per serving",
  "ocr.basis.unknown": "basis unknown",
  "ocr.visual.label": "{value}{unit} {nutrient} {basis}",
  "ocr.basis.uncertain.warning": "Basis unclear. We could not tell whether these values are per 100g or per serving, so treat every figure below with extra caution.",
  "ocr.row.saturates": "of which saturates",
  "ocr.row.carbohydrate": "Carbohydrate",
  "ocr.row.salt.derived": "(derived from sodium)",
  "ocr.disclaimer.unverified": "Read from your photo — not yet verified. Values we couldn’t read clearly are shown as ‘Data unavailable,’ never as zero. Always check these figures against the label before making a decision.",
  "ocr.retake_photo": "Retake photo",
  "ocr.pill.unverified": "Unverified",
  "ocr.instant_read": "Instant read · {basis}",
  "ocr.failure.message": "We couldn’t read this photo automatically. Your photo is still saved for our team to verify — or type the values into the fields above.",
  "ocr.status.reading_label": "Reading the label…",
  "ocr.vision.prefill_nudge": "Decoded from your photo. The values are pre-filled above — correct anything wrong, then tap Submit.",
  "ocr.status.reading_on_device": "Reading the label on your device…"
},
  ur: {}, // awaiting native review
  pl: {}  // awaiting native review
};
