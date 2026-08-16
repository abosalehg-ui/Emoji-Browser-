// Arabic users rarely type the hamza seat, the ta marbuta, or the alef
// maqsura the way the dataset spells them ("كاس" vs "كأس", "العاب" vs
// "ألعاب"). 582 of the 1358 Arabic names carry at least one of these, so a
// literal substring match silently returns nothing for a large slice of the
// data. Fold both the haystack and the query to the same skeleton first.
export function normalizeAr(s) {
  return String(s)
    .replace(/[أإآٱ]/g, 'ا') // أ إ آ ٱ -> ا
    .replace(/ة/g, 'ه') // ة -> ه
    .replace(/ى/g, 'ي') // ى -> ي
    .replace(/[ً-ْـ]/g, '') // tashkeel + tatweel
    .toLowerCase();
}

// Precompute a normalized haystack once per emoji so search doesn't rebuild
// strings for every entry on every keystroke.
function haystack(e) {
  if (e._search === undefined) {
    e._search = normalizeAr(
      [e.arName, e.enName, e.desc, e.descEn, e.emoji, ...(e.keywords || [])]
        .filter(Boolean)
        .join(' ')
    );
  }
  return e._search;
}

export function prepareSearch(emojis) {
  emojis.forEach((e) => {
    e._search = undefined;
    haystack(e);
  });
  return emojis;
}

export function searchEmojis(emojis, query) {
  if (!query) return emojis;
  const q = normalizeAr(query).trim();
  if (!q) return emojis;
  return emojis.filter((e) => haystack(e).includes(q));
}

export function filterByCategory(emojis, category) {
  if (!category || category === 'all') return emojis;
  return emojis.filter((e) => e.category === category);
}

export function buildIndex(emojis) {
  const byChar = new Map();
  emojis.forEach((e) => byChar.set(e.emoji, e));
  return byChar;
}
