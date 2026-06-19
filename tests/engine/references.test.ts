import { Document } from 'docx';
import { loadRules } from '../../src/rules/load';
import { buildSection } from '../../src/engine/section';
import { buildReferences } from '../../src/engine/references';
import { toBuffer } from '../../src/exporter/docx';
import { readDocx } from '../helpers/ooxml';
import type { Reference } from '../../src/model/types';

test('referências: título REFERÊNCIAS centralizado, ordem alfabética, 1,0, alinhadas à esquerda', async () => {
  const rules = loadRules('abnt-2024');
  const refs: Reference[] = [
    { sortKey: 'SOUZA', runs: [{ text: 'SOUZA, B. Obra Z.' }] },
    { sortKey: 'ALMEIDA', runs: [{ text: 'ALMEIDA, A. Obra A.' }] },
  ];
  const children = buildReferences(refs, rules);
  const doc = new Document({ sections: [buildSection(rules, children)] });
  const xml = (await readDocx(await toBuffer(doc))).documentXml;

  expect(xml).toContain('REFERÊNCIAS');
  expect(xml).toMatch(/w:jc w:val="center"[\s\S]*REFERÊNCIAS/);
  expect(xml.indexOf('Obra A.')).toBeLessThan(xml.indexOf('Obra Z.'));
  expect(xml).toMatch(/w:line="240"/);
  expect(xml).toMatch(/w:jc w:val="left"/);
});
