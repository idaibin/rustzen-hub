import assert from 'node:assert/strict';
import test from 'node:test';
import { serializeCsvCell } from './data-table-utils.ts';

test('CSV serializer neutralizes spreadsheet formulas before quoting', () => {
  assert.equal(serializeCsvCell('=HYPERLINK("https://example.test")'), "\"'=HYPERLINK(\"\"https://example.test\"\")\"");
  assert.equal(serializeCsvCell('  @SUM(A1:A2)'), "'  @SUM(A1:A2)");
  assert.equal(serializeCsvCell('normal, value'), '"normal, value"');
  assert.equal(serializeCsvCell('safe\r=2+2'), '"safe\r=2+2"');
  assert.equal(serializeCsvCell('\t+2+2'), "'\t+2+2");
  assert.equal(serializeCsvCell('safe\r\n@SUM(A1:A2)'), '"safe\r\n@SUM(A1:A2)"');
});
