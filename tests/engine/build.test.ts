import { loadRules } from '../../src/rules/load';
import { build } from '../../src/engine/build';
import { toBuffer } from '../../src/exporter/docx';
import { readDocx } from '../helpers/ooxml';
import type { StructuredDocument } from '../../src/model/types';

test('build monta documento com heading, parágrafo, citação longa e referências', async () => {
  const model: StructuredDocument = {
    body: [
      { kind: 'heading', level: 1, text: 'Introdução' },
      { kind: 'paragraph', runs: [{ text: 'Primeiro parágrafo.' }] },
      { kind: 'longCitation', text: 'Citação em bloco aqui.', citation: { authors: ['SILVA'], year: '2019', page: '5' } },
    ],
    references: [{ sortKey: 'SILVA', runs: [{ text: 'SILVA, A. Obra.' }] }],
  };
  const doc = build(model, loadRules('abnt-2024'));
  const xml = (await readDocx(await toBuffer(doc))).documentXml;

  expect(xml).toContain('1 INTRODUÇÃO');
  expect(xml).toContain('Primeiro parágrafo.');
  expect(xml).toContain('Citação em bloco aqui.');
  expect(xml).toContain('REFERÊNCIAS');
  expect(xml).toContain('SILVA, A. Obra.');
});

test('build aplica overrides do modelo (fonte Arial)', async () => {
  const model: StructuredDocument = {
    overrides: { fontFamily: 'Arial' },
    body: [{ kind: 'paragraph', runs: [{ text: 'x' }] }],
    references: [],
  };
  const xml = (await readDocx(await toBuffer(build(model, loadRules('abnt-2024'))))).documentXml;
  expect(xml).toMatch(/w:ascii="Arial"/);
});
