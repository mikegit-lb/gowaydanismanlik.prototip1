const foldTurkish = (value) => String(value || '')
  .toLocaleLowerCase('tr-TR')
  .replaceAll('ı', 'i')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replaceAll('ş', 's')
  .replaceAll('ğ', 'g')
  .replaceAll('ç', 'c')
  .replaceAll('ö', 'o')
  .replaceAll('ü', 'u')
  .replace(/\s+/g, ' ')
  .trim();

export const normalizeSearchText = (value) => foldTurkish(value);

export const dedupeSearchRecords = (records) => {
  const seen = new Set();
  return records.filter((record) => {
    if (!record?.url || seen.has(record.url)) return false;
    seen.add(record.url);
    return true;
  });
};

const fieldsFor = (record) => ({
  title: foldTurkish(record.title),
  category: foldTurkish(record.category),
  summary: foldTurkish(record.summary),
  headings: foldTurkish((record.headings || []).join(' '))
});

export function rankSearchRecords(records, query) {
  const normalizedQuery = foldTurkish(query);
  if (!normalizedQuery) return [];
  const terms = normalizedQuery.split(' ').filter(Boolean);
  return dedupeSearchRecords(records).map((record, index) => {
    const fields = fieldsFor(record);
    const searchable = Object.values(fields).join(' ');
    const allTermsMatch = terms.every((term) => searchable.includes(term));
    if (!allTermsMatch) return null;
    let score = 1;
    if (fields.title === normalizedQuery) score += 1000;
    else if (fields.title.startsWith(normalizedQuery)) score += 800;
    else if (fields.title.includes(normalizedQuery)) score += 600;
    if (fields.headings.includes(normalizedQuery)) score += 300;
    if (fields.category.includes(normalizedQuery)) score += 220;
    if (fields.summary.includes(normalizedQuery)) score += 160;
    score += terms.reduce((total, term) => total + (fields.title.includes(term) ? 40 : 0), 0);
    return { record, score, index };
  }).filter(Boolean).sort((a, b) => b.score - a.score || a.record.title.localeCompare(b.record.title, 'tr') || a.index - b.index).map(({ record }) => record);
}
