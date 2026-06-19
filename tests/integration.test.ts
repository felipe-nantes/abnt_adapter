import { loadRules } from '../src/rules/load';
import { build } from '../src/engine/build';
import { toBuffer } from '../src/exporter/docx';
import { readDocx } from './helpers/ooxml';
import { integrationDoc } from '../fixtures/integration';

test('pipeline ponta a ponta produz .docx conforme', async () => {
  const { documentXml, headerXmls } = await readDocx(await toBuffer(build(integrationDoc, loadRules('abnt-2024'))));

  expect(documentXml).toContain('1 INTRODUÇÃO');
  expect(documentXml).toContain('1.1 Objetivos');
  expect(documentXml).toContain('2 DESENVOLVIMENTO');
  expect(documentXml).toContain('(Silva, 2019, p. 1)');
  // "et al." (4+ autores) sai em run separado e itálico (NBR 10520) — texto fica fragmentado no XML
  expect(documentXml).toContain('(Souza ');
  expect(documentXml).toContain('et al.');
  expect(documentXml).toContain(', 2021, p. 10)');
  expect(documentXml).toMatch(/<w:i\/>/); // única fonte de itálico no fixture é o "et al."
  expect(documentXml.indexOf('Título A')).toBeLessThan(documentXml.indexOf('Título Z'));
  expect(documentXml).toMatch(/w:top="1701"/);
  expect(headerXmls.join('')).toMatch(/PAGE/);
});
