import test from 'node:test';
import assert from 'node:assert/strict';
import { dedupeSearchRecords, normalizeSearchText, rankSearchRecords } from './search-core.mjs';

const records = [
  { url: './sektor-gida.html', title: 'Gıda Güvenliği', category: 'Sektör', summary: 'ISO 22000 ve HACCP', headings: ['Gıda'] },
  { url: './iso-50001.html', title: 'ISO 50001 Enerji Yönetimi', category: 'Hizmet', summary: 'Enerji performansı', headings: ['SEU ve EnPI'] },
  { url: './kaynaklar.html#resource-iso-50001', title: 'ISO 50001 Çalışma Kitabı', category: 'Kaynak', summary: 'Uygulama kaynağı', headings: ['Enerji'] }
];

test('normalizes Turkish characters and whitespace', () => {
  assert.equal(normalizeSearchText('  GIDA  Güvenliği — İÇ  '), 'gida guvenligi — ic');
});

test('ranks exact and title-prefix matches first', () => {
  const exact = rankSearchRecords(records, 'ISO 50001 Enerji Yönetimi');
  assert.equal(exact[0].url, './iso-50001.html');
  const prefix = rankSearchRecords(records, 'ISO 50001');
  assert.deepEqual(prefix.map((record) => record.url), ['./kaynaklar.html#resource-iso-50001', './iso-50001.html']);
});

test('handles empty and unknown queries', () => {
  assert.deepEqual(rankSearchRecords(records, '   '), []);
  assert.deepEqual(rankSearchRecords(records, 'bilinmeyen konu'), []);
});

test('deduplicates records by URL', () => {
  assert.equal(dedupeSearchRecords([records[0], { ...records[0], title: 'Yinelenen' }, records[1]]).length, 2);
});
