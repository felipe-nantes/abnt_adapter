import { Document } from 'docx';
import { loadRules } from '../../src/rules/load';
import { buildSection } from '../../src/engine/section';
import { buildParagraph } from '../../src/engine/paragraph';
import { toBuffer } from '../../src/exporter/docx';
import { readDocx } from '../helpers/ooxml';
import type { Paragraph as ParaModel } from '../../src/model/types';

const render = async (p: ParaModel) => {
  const rules = loadRules('abnt-2024');
  const doc = new Document({ sections: [buildSection(rules, [buildParagraph(p, rules)])] });
  return (await readDocx(await toBuffer(doc))).documentXml;
};

test('parágrafo do corpo: justificado, recuo 1ª linha 1,25cm, 1,5, fonte 12pt', async () => {
  const xml = await render({ kind: 'paragraph', runs: [{ text: 'Texto do corpo.' }] });
  expect(xml).toMatch(/w:jc w:val="(both|distribute)"/);
  expect(xml).toMatch(/w:firstLine="709"/);
  expect(xml).toMatch(/w:line="360"/);
  expect(xml).toMatch(/w:sz w:val="24"/);
  expect(xml).toContain('Texto do corpo.');
});

test('citação curta inline vai entre aspas duplas + parentético autor-data', async () => {
  const xml = await render({
    kind: 'paragraph',
    runs: [
      { text: 'Como afirma o autor: ' },
      { kind: 'shortCitation', text: 'o método é determinístico',
        citation: { authors: ['SILVA'], year: '2019', page: '1' } },
    ],
  });
  expect(xml).toContain('“o método é determinístico”'); // aspas curvas
  expect(xml).toContain('(Silva, 2019, p. 1)');
});
