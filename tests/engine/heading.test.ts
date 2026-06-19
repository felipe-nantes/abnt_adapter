import { Document } from 'docx';
import { loadRules } from '../../src/rules/load';
import { buildSection } from '../../src/engine/section';
import { buildHeading, SectionCounter } from '../../src/engine/heading';
import { toBuffer } from '../../src/exporter/docx';
import { readDocx } from '../helpers/ooxml';

test('numeração progressiva sem ponto após o número; nível 1 em caixa alta/negrito; nova página', async () => {
  const rules = loadRules('abnt-2024');
  const c = new SectionCounter();
  const children = [
    buildHeading({ kind: 'heading', level: 1, text: 'Introdução' }, c, rules),
    buildHeading({ kind: 'heading', level: 2, text: 'Contexto' }, c, rules),
    buildHeading({ kind: 'heading', level: 1, text: 'Desenvolvimento' }, c, rules),
  ];
  const doc = new Document({ sections: [buildSection(rules, children)] });
  const xml = (await readDocx(await toBuffer(doc))).documentXml;

  expect(xml).toContain('1 INTRODUÇÃO');
  expect(xml).toContain('1.1 Contexto');
  expect(xml).toContain('2 DESENVOLVIMENTO');
  expect(xml).not.toContain('1. INTRODUÇÃO');
  expect(xml).toMatch(/w:b\/>/);
  expect(xml).toMatch(/w:pageBreakBefore/);
});

test('SectionCounter incrementa por nível e reseta filhos', () => {
  const c = new SectionCounter();
  expect(c.next(1)).toBe('1');
  expect(c.next(2)).toBe('1.1');
  expect(c.next(2)).toBe('1.2');
  expect(c.next(1)).toBe('2');
  expect(c.next(2)).toBe('2.1');
});
