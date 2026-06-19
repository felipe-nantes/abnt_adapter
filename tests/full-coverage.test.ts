import { Document } from 'docx';
import { loadRules, applyOverrides } from '../src/rules/load';
import { rulesJsonSchema } from '../src/rules/schema';
import { buildSection } from '../src/engine/section';
import { buildParagraph } from '../src/engine/paragraph';
import { buildHeading, SectionCounter } from '../src/engine/heading';
import { buildLongCitation, buildCitationRuns } from '../src/engine/citation';
import { buildReferences } from '../src/engine/references';
import { build } from '../src/engine/build';
import { toBuffer } from '../src/exporter/docx';
import { readDocx } from './helpers/ooxml';
import type { Reference, StructuredDocument } from '../src/model/types';

const rules = loadRules('abnt-2024');

const docXml = async (children: Parameters<typeof buildSection>[1]) =>
  (await readDocx(await toBuffer(new Document({ sections: [buildSection(rules, children)] })))).documentXml;

// ---------- regras / unidades / overrides ----------

test('1. loadRules rejeita perfil desconhecido', () => {
  expect(() => loadRules('xpto' as 'abnt-2024')).toThrow(/perfil desconhecido/);
});

test('2. sistema de citação default é autor-data', () => {
  expect(rules.citations.system).toBe('author-date');
});

test('3. schema Zod rejeita JSON vazio (falha cedo)', () => {
  expect(() => rulesJsonSchema.parse({})).toThrow();
});

test('4. schema Zod rejeita titleStylesByLevel sem o nível 4', () => {
  const bad = {
    page: { widthCm: 21, heightCm: 29.7, margins: { top: 3, left: 3, bottom: 2, right: 2 } },
    fonts: { allowedFamilies: ['Arial'], defaultFamily: 'Arial', color: '#000000', sizesPt: { body: 12, longCitation: 10, pageNumber: 10 } },
    spacing: { body: 1.5, single: 1.0 },
    paragraph: { firstLineIndentCm: 1.25 },
    pagination: { distanceFromTopCm: 2 },
    sections: {
      titleStylesByLevel: {
        '1': { case: 'uppercase', bold: true, italic: false },
        '2': { case: 'title', bold: true, italic: false },
        '3': { case: 'sentence', bold: true, italic: false },
        '5': { case: 'sentence', bold: false, italic: false },
      },
      unnumberedTitles: { case: 'uppercase', bold: true },
    },
    citations: { system: 'author-date', long: { leftIndentCm: 4 }, authorDateFormat: { etAlFromAuthors: 4, etAlItalic: true } },
    references: {},
  };
  expect(() => rulesJsonSchema.parse(bad)).toThrow();
});

test('5. applyOverrides sem overrides retorna o mesmo objeto', () => {
  expect(applyOverrides(rules, undefined)).toBe(rules);
});

test('6. override de titleStylesByLevel é aplicado', () => {
  const r = applyOverrides(rules, { titleStylesByLevel: { 1: { case: 'sentence', bold: false, italic: false } } });
  expect(r.sections.titleStylesByLevel[1]).toEqual({ case: 'sentence', bold: false, italic: false });
});

test('7. override dos 4 lados de margem converte para twips', () => {
  const r = applyOverrides(rules, { margins: { top: 3, left: 3, bottom: 2, right: 2 } });
  expect(r.page.margin).toEqual({ top: 1701, left: 1701, bottom: 1134, right: 1134 });
});

test('8. override de margem esquerda abaixo de 3cm é rejeitado', () => {
  expect(() => applyOverrides(rules, { margins: { left: 2.5 } }))
    .toThrow(/margem 2.5cm < mínimo 3cm \(left\)/);
});

// ---------- citações (unidade) ----------

test('9. buildCitationRuns com 2 autores junta por ";"', () => {
  expect(buildCitationRuns({ authors: ['SILVA', 'SOUZA'], year: '2020' }, rules))
    .toEqual([{ text: '(Silva; Souza, 2020)' }]);
});

test('10. buildCitationRuns usa "local." para documento não paginado', () => {
  expect(buildCitationRuns({ authors: ['SILVA'], year: '2020', location: 'cap. 2' }, rules))
    .toEqual([{ text: '(Silva, 2020, local. cap. 2)' }]);
});

test('11. buildCitationRuns prioriza página sobre localização', () => {
  expect(buildCitationRuns({ authors: ['SILVA'], year: '2020', page: '5', location: 'cap. 2' }, rules))
    .toEqual([{ text: '(Silva, 2020, p. 5)' }]);
});

test('12. SectionCounter aninha três níveis e reseta', () => {
  const c = new SectionCounter();
  expect(c.next(1)).toBe('1');
  expect(c.next(2)).toBe('1.1');
  expect(c.next(3)).toBe('1.1.1');
  expect(c.next(3)).toBe('1.1.2');
  expect(c.next(2)).toBe('1.2');
});

test('13. buildReferences retorna título + entrada + linha em branco por referência', () => {
  const refs: Reference[] = [
    { sortKey: 'A', runs: [{ text: 'A.' }] },
    { sortKey: 'B', runs: [{ text: 'B.' }] },
  ];
  expect(buildReferences(refs, rules).length).toBe(1 + refs.length * 2);
});

// ---------- saída OOXML ----------

test('14. corpo usa cor de fonte preta', async () => {
  const xml = await docXml([buildParagraph({ kind: 'paragraph', runs: [{ text: 'x' }] }, rules)]);
  expect(xml).toMatch(/w:color w:val="000000"/);
});

test('15. parágrafo do corpo tem espaçamento antes/depois = 0', async () => {
  const xml = await docXml([buildParagraph({ kind: 'paragraph', runs: [{ text: 'x' }] }, rules)]);
  expect(xml).toMatch(/w:before="0"/);
  expect(xml).toMatch(/w:after="0"/);
});

test('16. parágrafo do corpo é justificado (both)', async () => {
  const xml = await docXml([buildParagraph({ kind: 'paragraph', runs: [{ text: 'x' }] }, rules)]);
  expect(xml).toMatch(/w:jc w:val="both"/);
});

test('17. run com bold:true renderiza negrito', async () => {
  const xml = await docXml([buildParagraph({ kind: 'paragraph', runs: [{ text: 'x', bold: true }] }, rules)]);
  expect(xml).toMatch(/<w:b\/>/);
});

test('18. título nível 4 renderiza em itálico', async () => {
  const c = new SectionCounter();
  const xml = await docXml([buildHeading({ kind: 'heading', level: 4, text: 'Item' }, c, rules)]);
  expect(xml).toMatch(/<w:i\/>/);
  expect(xml).toContain('Item');
});

test('19. título REFERÊNCIAS é negrito', async () => {
  const xml = await docXml(buildReferences([{ sortKey: 'A', runs: [{ text: 'Entrada.' }] }], rules));
  expect(xml).toContain('REFERÊNCIAS');
  expect(xml).toMatch(/<w:b\/>/);
});

test('20. citação longa com 4+ autores marca "et al." em itálico', async () => {
  const block = buildLongCitation(
    { kind: 'longCitation', text: 'Trecho longo.', citation: { authors: ['SOUZA', 'LIMA', 'COSTA', 'REIS'], year: '2021', page: '9' } },
    rules,
  );
  const xml = await docXml([block]);
  expect(xml).toContain('et al.');
  expect(xml).toMatch(/<w:i\/>/);
});

test('21. número de página no header usa fonte 10pt (sz=20)', async () => {
  const { headerXmls } = await readDocx(await toBuffer(new Document({ sections: [buildSection(rules, [])] })));
  expect(headerXmls.join('')).toMatch(/w:sz w:val="20"/);
});

test('22. documento sem referências não imprime título REFERÊNCIAS', async () => {
  const model: StructuredDocument = { body: [{ kind: 'paragraph', runs: [{ text: 'corpo' }] }], references: [] };
  const xml = (await readDocx(await toBuffer(build(model, rules)))).documentXml;
  expect(xml).not.toContain('REFERÊNCIAS');
});
