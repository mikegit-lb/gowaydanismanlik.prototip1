(() => {
  const index = Array.isArray(window.GOWAY_SEARCH_INDEX) ? window.GOWAY_SEARCH_INDEX : [];
  const form = document.querySelector('[data-site-search-form]');
  const input = document.querySelector('#search-query');
  const results = document.querySelector('[data-search-results]');
  const status = document.querySelector('[data-search-status]');
  const empty = document.querySelector('[data-search-empty]');
  const count = document.querySelector('[data-search-count]');
  if (!form || !input || !results || !status) return;

  const normalize = (value) => String(value || '')
    .toLocaleLowerCase('tr-TR')
    .replaceAll('ı', 'i')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replaceAll('ş', 's').replaceAll('ğ', 'g').replaceAll('ç', 'c').replaceAll('ö', 'o').replaceAll('ü', 'u')
    .replace(/\s+/g, ' ').trim();
  const fieldsFor = (record) => ({
    title: normalize(record.title),
    category: normalize(record.category),
    summary: normalize(record.summary),
    headings: normalize((record.headings || []).join(' '))
  });
  const rank = (query) => {
    const normalizedQuery = normalize(query);
    if (!normalizedQuery) return [];
    const terms = normalizedQuery.split(' ').filter(Boolean);
    return index.map((record, order) => {
      const fields = fieldsFor(record);
      const searchable = Object.values(fields).join(' ');
      if (!terms.every((term) => searchable.includes(term))) return null;
      let score = 1;
      if (fields.title === normalizedQuery) score += 1000;
      else if (fields.title.startsWith(normalizedQuery)) score += 800;
      else if (fields.title.includes(normalizedQuery)) score += 600;
      if (fields.headings.includes(normalizedQuery)) score += 300;
      if (fields.category.includes(normalizedQuery)) score += 220;
      if (fields.summary.includes(normalizedQuery)) score += 160;
      score += terms.reduce((total, term) => total + (fields.title.includes(term) ? 40 : 0), 0);
      return { record, score, order };
    }).filter(Boolean).sort((a, b) => b.score - a.score || a.record.title.localeCompare(b.record.title, 'tr') || a.order - b.order).map(({ record }) => record);
  };
  const queryFromUrl = () => new URLSearchParams(window.location.search).get('q') || '';
  const writeText = (tag, text, className = '') => { const node = document.createElement(tag); node.textContent = text; if (className) node.className = className; return node; };
  const render = () => {
    const query = input.value.trim();
    results.replaceChildren();
    if (!query) {
      empty.hidden = false;
      count.hidden = true;
      status.textContent = 'Hizmet, sektör, kaynak veya eğitim arayın.';
      return;
    }
    const matches = rank(query);
    empty.hidden = matches.length > 0;
    count.hidden = false;
    count.textContent = `${matches.length} sonuç bulundu.`;
    status.textContent = matches.length ? `${matches.length} sonuç bulundu.` : 'Aramanızla eşleşen sonuç bulunamadı.';
    matches.slice(0, 30).forEach((record) => {
      const article = document.createElement('article');
      article.className = 'search-result';
      article.append(writeText('p', record.category, 'eyebrow'));
      const link = document.createElement('a');
      link.href = record.url;
      link.append(writeText('h2', record.title));
      article.append(link);
      if (record.summary) article.append(writeText('p', record.summary));
      results.append(article);
    });
  };
  const syncQuery = () => {
    const url = new URL(window.location.href);
    if (input.value.trim()) url.searchParams.set('q', input.value.trim());
    else url.searchParams.delete('q');
    window.history.replaceState({}, '', url);
  };
  input.value = queryFromUrl();
  form.addEventListener('submit', (event) => { event.preventDefault(); syncQuery(); render(); input.focus(); window.gowayTrack?.('search_submit', { query: input.value.trim() }); });
  input.addEventListener('input', () => { syncQuery(); render(); });
  render();
})();
