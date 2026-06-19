import { Document } from 'docx';
import { loadRules } from '../../src/rules/load';
import { buildSection } from '../../src/engine/section';
import { buildLongCitation, buildCitationRuns } from '../../src/engine/citation';
import { toBuffer } from '../../src/exporter/docx';
import { readDocx } from '../helpers/ooxml';

test('buildCitationRuns usa et al. (em itálico) a partir de 4 autores', () => {
  const rules = loadRules('abnt-2024');
  const four = buildCitationRuns({ authors: ['SILVA','SOUZA','LIMA','COSTA'], year: '2020' }, rules);
  expect(four).toEqual([
    { text: '(Silva ' },
    { text: 'et al.', italic: true },
    { text: ', 2020)' },
  ]);
  const three = buildCitationRuns({ authors: ['SILVA','SOUZA','LIMA'], year: '2020' }, rules);
  expect(three).toEqual([{ text: '(Silva; Souza; Lima, 2020)' }]);
});

test('citação longa: bloco recuo 4cm, 10pt, 1,0, sem aspas', async () => {
  const rules = loadRules('abnt-2024');
  const block = buildLongCitation(
    { kind: 'longCitation', text: 'Trecho longo da citação com mais de quatro linhas.',
      citation: { authors: ['SILVA'], year: '2019', page: '42' } }, rules);
  const doc = new Document({ sections: [buildSection(rules, [block])] });
  const xml = (await readDocx(await toBuffer(doc))).documentXml;

  expect(xml).toMatch(/w:left="2268"/);
  expect(xml).toMatch(/w:line="240"/);
  expect(xml).toMatch(/w:sz w:val="20"/);
  expect(xml).not.toContain('“');
  expect(xml).toContain('(Silva, 2019, p. 42)');
});
