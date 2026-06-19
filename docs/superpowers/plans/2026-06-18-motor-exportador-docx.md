# Motor determinístico + Exportador `.docx` — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dado um modelo estruturado (via fixtures) + o perfil `config/abnt-2024.rules.json`, gerar um `.docx` em conformidade ABNT (corpo + referências), com todos os testes de formatação assertando no XML OOXML final.

**Architecture:** Pacote TS único. `model/` (só tipos) → `rules/` (carrega/valida JSON + converte unidades) → `engine/` (sub-builders modelo+regras → objetos da lib `docx`) → `exporter/` (serializa em Buffer `.docx`). Testes geram o `.docx`, descompactam o zip e asseram no XML real.

**Tech Stack:** TypeScript, Vitest, lib `docx`, Zod, jszip (leitura OOXML nos testes). Zero API/LLM. Saída só `.docx`.

**Spec:** `docs/superpowers/specs/2026-06-18-motor-exportador-docx-design.md`

---

## File Structure

| Arquivo | Responsabilidade |
|---|---|
| `package.json`, `tsconfig.json`, `vitest.config.ts` | scaffold do pacote TS |
| `config/abnt-2024.rules.json` | fonte da verdade (já existe) |
| `src/model/types.ts` | tipos do `StructuredDocument` (sem lógica) |
| `src/model/schema.ts` | Zod schema do modelo (validação de borda de fixtures) |
| `src/rules/units.ts` | conversões cm→twips, pt→half-points, spacing→line |
| `src/rules/schema.ts` | Zod schema do JSON de regras |
| `src/rules/load.ts` | `loadRules` + `applyOverrides` → `ResolvedRules` |
| `src/engine/build.ts` | orquestrador `build(model, rules)` |
| `src/engine/section.ts` | `buildSection` (A4, margens, header de paginação) |
| `src/engine/paragraph.ts` | `buildParagraph`, `buildRuns` |
| `src/engine/heading.ts` | `buildHeading` + contador de numeração progressiva |
| `src/engine/citation.ts` | `buildCitationText`, `buildLongCitation` |
| `src/engine/references.ts` | `buildReferences` |
| `src/exporter/docx.ts` | `toBuffer(doc)` |
| `tests/helpers/ooxml.ts` | descompacta `.docx`, expõe XML pros asserts |
| `fixtures/*.ts` | modelos de entrada (mínimos + integração) |

**Tipos compartilhados** (definidos na Task 2, referenciados depois):

```ts
// src/rules/load.ts
export type TitleStyle = { case: 'uppercase'|'title'|'sentence'; bold: boolean; italic: boolean };
export type ResolvedRules = {
  page: { widthTw: number; heightTw: number; headerTw: number;
          margin: { top: number; right: number; bottom: number; left: number } };
  fonts: { family: string; color: string; bodyHalfPt: number; smallHalfPt: number };
  spacing: { bodyLine: number; singleLine: number };
  paragraph: { firstLineIndentTw: number };
  sections: { titleStylesByLevel: Record<1|2|3|4|5, TitleStyle> };
  citations: { system: 'author-date'|'numeric'; longIndentTw: number; etAlFrom: number };
  unnumberedTitles: { case: 'uppercase'; bold: boolean };
};
```

---

## Task 1: Scaffold do pacote

**Files:**
- Create: `package.json`, `tsconfig.json`, `vitest.config.ts`, `.gitignore`

- [ ] **Step 1: Criar `package.json`**

```json
{
  "name": "abnt-formatador",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "docx": "^9.0.0",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "typescript": "^5.5.0",
    "vitest": "^2.0.0",
    "jszip": "^3.10.0"
  }
}
```

- [ ] **Step 2: Criar `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "types": ["vitest/globals"]
  },
  "include": ["src", "tests", "fixtures"]
}
```

- [ ] **Step 3: Criar `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';
export default defineConfig({ test: { globals: true } });
```

- [ ] **Step 4: Criar `.gitignore`**

```
node_modules
dist
*.docx
```

- [ ] **Step 5: Instalar deps**

Run: `npm install`
Expected: instala sem erro; cria `node_modules` e `package-lock.json`.

- [ ] **Step 6: Commit**

```bash
git init
git add package.json tsconfig.json vitest.config.ts .gitignore package-lock.json
git commit -m "chore: scaffold TS package (vitest, docx, zod)"
```

---

## Task 2: Conversão de unidades

**Files:**
- Create: `src/rules/units.ts`
- Test: `tests/rules/units.test.ts`

- [ ] **Step 1: Escrever o teste que falha**

```ts
// tests/rules/units.test.ts
import { cmToTw, ptToHalfPt, spacingToLine } from '../../src/rules/units';

test('cmToTw converte cm para twips arredondado', () => {
  expect(cmToTw(3)).toBe(1701);   // 3 * 566.93 = 1700.79 → 1701
  expect(cmToTw(2)).toBe(1134);   // 1133.86 → 1134
  expect(cmToTw(1.25)).toBe(709); // 708.66 → 709
  expect(cmToTw(4)).toBe(2268);
});

test('ptToHalfPt dobra o valor', () => {
  expect(ptToHalfPt(12)).toBe(24);
  expect(ptToHalfPt(10)).toBe(20);
});

test('spacingToLine mapeia multiplicador para line', () => {
  expect(spacingToLine(1.5)).toBe(360);
  expect(spacingToLine(1.0)).toBe(240);
});
```

- [ ] **Step 2: Rodar o teste e ver falhar**

Run: `npx vitest run tests/rules/units.test.ts`
Expected: FAIL — `Cannot find module '../../src/rules/units'`.

- [ ] **Step 3: Implementar**

```ts
// src/rules/units.ts
const TWIPS_PER_CM = 566.93;

export const cmToTw = (cm: number): number => Math.round(cm * TWIPS_PER_CM);
export const ptToHalfPt = (pt: number): number => Math.round(pt * 2);
export const spacingToLine = (mult: number): number => Math.round(mult * 240);
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run tests/rules/units.test.ts`
Expected: PASS (3 testes).

- [ ] **Step 5: Commit**

```bash
git add src/rules/units.ts tests/rules/units.test.ts
git commit -m "feat: unit conversions cm->tw, pt->half-pt, spacing->line"
```

---

## Task 3: Schema Zod + `loadRules`

**Files:**
- Create: `src/rules/schema.ts`, `src/rules/load.ts`
- Test: `tests/rules/load.test.ts`

- [ ] **Step 1: Escrever o teste que falha**

```ts
// tests/rules/load.test.ts
import { loadRules } from '../../src/rules/load';

test('loadRules resolve o perfil abnt-2024 em unidades docx', () => {
  const r = loadRules('abnt-2024');
  expect(r.page.margin.top).toBe(1701);
  expect(r.page.margin.bottom).toBe(1134);
  expect(r.page.widthTw).toBe(11906);   // 21cm
  expect(r.fonts.family).toBe('Times New Roman');
  expect(r.fonts.bodyHalfPt).toBe(24);
  expect(r.fonts.smallHalfPt).toBe(20);
  expect(r.spacing.bodyLine).toBe(360);
  expect(r.paragraph.firstLineIndentTw).toBe(709);
  expect(r.citations.longIndentTw).toBe(2268);
  expect(r.citations.etAlFrom).toBe(4);
  expect(r.sections.titleStylesByLevel[1]).toEqual({ case: 'uppercase', bold: true, italic: false });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run tests/rules/load.test.ts`
Expected: FAIL — módulo não encontrado.

- [ ] **Step 3: Escrever o Zod schema do JSON**

```ts
// src/rules/schema.ts
import { z } from 'zod';

const titleStyle = z.object({
  case: z.enum(['uppercase', 'title', 'sentence']),
  bold: z.boolean(),
  italic: z.boolean(),
});

export const rulesJsonSchema = z.object({
  page: z.object({
    widthCm: z.number(),
    heightCm: z.number(),
    margins: z.object({ top: z.number(), left: z.number(), bottom: z.number(), right: z.number() }),
  }),
  fonts: z.object({
    allowedFamilies: z.array(z.string()),
    defaultFamily: z.string(),
    color: z.string(),
    sizesPt: z.object({ body: z.number(), longCitation: z.number() }).passthrough(),
  }),
  spacing: z.object({ body: z.number(), single: z.number() }).passthrough(),
  paragraph: z.object({ firstLineIndentCm: z.number() }).passthrough(),
  pagination: z.object({ distanceFromTopCm: z.number() }).passthrough(),
  sections: z.object({
    titleStylesByLevel: z.record(titleStyle),
  }).passthrough(),
  citations: z.object({
    system: z.enum(['author-date', 'numeric']),
    long: z.object({ leftIndentCm: z.number() }).passthrough(),
    authorDateFormat: z.object({ etAlFromAuthors: z.number() }).passthrough(),
  }).passthrough(),
  references: z.object({}).passthrough(),
  preTextualElements: z.object({}).passthrough().optional(),
}).passthrough();

export type RulesJson = z.infer<typeof rulesJsonSchema>;
```

- [ ] **Step 4: Escrever `loadRules`**

```ts
// src/rules/load.ts
import rawJson from '../../config/abnt-2024.rules.json'; // Vitest/Vite resolve JSON; tsconfig resolveJsonModule
import { rulesJsonSchema } from './schema';
import { cmToTw, ptToHalfPt, spacingToLine } from './units';

export type TitleStyle = { case: 'uppercase'|'title'|'sentence'; bold: boolean; italic: boolean };
export type ResolvedRules = {
  page: { widthTw: number; heightTw: number; headerTw: number;
          margin: { top: number; right: number; bottom: number; left: number } };
  fonts: { family: string; color: string; bodyHalfPt: number; smallHalfPt: number };
  spacing: { bodyLine: number; singleLine: number };
  paragraph: { firstLineIndentTw: number };
  sections: { titleStylesByLevel: Record<1|2|3|4|5, TitleStyle> };
  citations: { system: 'author-date'|'numeric'; longIndentTw: number; etAlFrom: number };
  unnumberedTitles: { case: 'uppercase'; bold: boolean };
};

export function loadRules(profile: 'abnt-2024'): ResolvedRules {
  if (profile !== 'abnt-2024') throw new Error(`perfil desconhecido: ${profile}`);
  const j = rulesJsonSchema.parse(rawJson);
  const styles = j.sections.titleStylesByLevel as Record<string, TitleStyle>;
  return {
    page: {
      widthTw: cmToTw(j.page.widthCm),
      heightTw: cmToTw(j.page.heightCm),
      headerTw: cmToTw((j.pagination as any).distanceFromTopCm),
      margin: {
        top: cmToTw(j.page.margins.top),
        right: cmToTw(j.page.margins.right),
        bottom: cmToTw(j.page.margins.bottom),
        left: cmToTw(j.page.margins.left),
      },
    },
    fonts: {
      family: j.fonts.defaultFamily,
      color: j.fonts.color.replace('#', ''),
      bodyHalfPt: ptToHalfPt(j.fonts.sizesPt.body),
      smallHalfPt: ptToHalfPt(j.fonts.sizesPt.longCitation),
    },
    spacing: { bodyLine: spacingToLine(j.spacing.body), singleLine: spacingToLine(j.spacing.single) },
    paragraph: { firstLineIndentTw: cmToTw(j.paragraph.firstLineIndentCm) },
    sections: {
      titleStylesByLevel: {
        1: styles['1'], 2: styles['2'], 3: styles['3'], 4: styles['4'], 5: styles['5'],
      },
    },
    citations: {
      system: j.citations.system,
      longIndentTw: cmToTw(j.citations.long.leftIndentCm),
      etAlFrom: j.citations.authorDateFormat.etAlFromAuthors,
    },
    unnumberedTitles: { case: 'uppercase', bold: true },
  };
}
```

- [ ] **Step 5: Rodar e ver passar**

Run: `npx vitest run tests/rules/load.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/rules/schema.ts src/rules/load.ts tests/rules/load.test.ts
git commit -m "feat: loadRules resolves abnt-2024 JSON to docx units (zod-validated)"
```

---

## Task 4: `applyOverrides` + validação contra norma

**Files:**
- Modify: `src/rules/load.ts`
- Create: `src/model/types.ts`
- Test: `tests/rules/overrides.test.ts`

- [ ] **Step 1: Criar os tipos do modelo (usados aqui e adiante)**

```ts
// src/model/types.ts
export type TitleStyle = { case: 'uppercase'|'title'|'sentence'; bold: boolean; italic: boolean };

export type CitationRef = { authors: string[]; year: string; page?: string; location?: string };
export type ShortCitation = { kind: 'shortCitation'; text: string; citation: CitationRef };
export type Run = { text: string; italic?: boolean; bold?: boolean } | ShortCitation;

export type Heading = { kind: 'heading'; level: 1|2|3|4|5; text: string };
export type Paragraph = { kind: 'paragraph'; runs: Run[] };
export type LongCitation = { kind: 'longCitation'; text: string; citation: CitationRef };
export type Block = Heading | Paragraph | LongCitation;

export type Reference = { sortKey: string; runs: Run[] };

export type ProfileOverrides = {
  fontFamily?: 'Times New Roman' | 'Arial';
  citationSystem?: 'author-date' | 'numeric';
  titleStylesByLevel?: Partial<Record<1|2|3|4|5, TitleStyle>>;
  margins?: { top?: number; left?: number; bottom?: number; right?: number }; // cm
};

export type StructuredDocument = {
  overrides?: ProfileOverrides;
  body: Block[];
  references: Reference[];
};
```

- [ ] **Step 2: Escrever o teste que falha**

```ts
// tests/rules/overrides.test.ts
import { loadRules, applyOverrides } from '../../src/rules/load';

test('override de fontFamily válido é aplicado', () => {
  const r = applyOverrides(loadRules('abnt-2024'), { fontFamily: 'Arial' });
  expect(r.fonts.family).toBe('Arial');
});

test('override de margem válido é convertido para twips', () => {
  const r = applyOverrides(loadRules('abnt-2024'), { margins: { top: 3.5 } });
  expect(r.page.margin.top).toBe(1984); // 3.5 * 566.93 = 1984.25 → 1984
});

test('override de margem abaixo do mínimo é rejeitado', () => {
  expect(() => applyOverrides(loadRules('abnt-2024'), { margins: { bottom: 1.5 } }))
    .toThrow(/margem .* mínimo/);
});

test('citationSystem numeric é aceito como override válido', () => {
  const r = applyOverrides(loadRules('abnt-2024'), { citationSystem: 'numeric' });
  expect(r.citations.system).toBe('numeric');
});
```

- [ ] **Step 3: Implementar `applyOverrides` em `src/rules/load.ts`**

Adicione o import no topo e a função no fim do arquivo:

```ts
// topo de src/rules/load.ts
import type { ProfileOverrides } from '../model/types';
import { cmToTw } from './units'; // já importado junto com os outros; garanta presença

const MIN_MARGIN_CM = 2.0; // menor valor admitido pela ABNT (inferior/direita)

export function applyOverrides(rules: ResolvedRules, overrides?: ProfileOverrides): ResolvedRules {
  if (!overrides) return rules;
  const next: ResolvedRules = structuredClone(rules);

  if (overrides.fontFamily) next.fonts.family = overrides.fontFamily;
  if (overrides.citationSystem) next.citations.system = overrides.citationSystem;

  if (overrides.titleStylesByLevel) {
    for (const [lvl, style] of Object.entries(overrides.titleStylesByLevel)) {
      next.sections.titleStylesByLevel[Number(lvl) as 1|2|3|4|5] = style!;
    }
  }

  if (overrides.margins) {
    for (const [side, cm] of Object.entries(overrides.margins) as [keyof typeof overrides.margins, number][]) {
      if (cm < MIN_MARGIN_CM) throw new Error(`margem ${cm}cm < mínimo ${MIN_MARGIN_CM}cm (${side})`);
      next.page.margin[side] = cmToTw(cm);
    }
  }
  return next;
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run tests/rules/overrides.test.ts`
Expected: PASS (4 testes).

- [ ] **Step 5: Commit**

```bash
git add src/model/types.ts src/rules/load.ts tests/rules/overrides.test.ts
git commit -m "feat: model types + applyOverrides with norm validation"
```

---

## Task 5: Exporter + helper OOXML

**Files:**
- Create: `src/exporter/docx.ts`, `tests/helpers/ooxml.ts`
- Test: `tests/exporter/docx.test.ts`

- [ ] **Step 1: Escrever o teste que falha**

```ts
// tests/exporter/docx.test.ts
import { Document, Paragraph, TextRun } from 'docx';
import { toBuffer } from '../../src/exporter/docx';
import { readDocx } from '../helpers/ooxml';

test('toBuffer gera um .docx descompactável com o texto no document.xml', async () => {
  const doc = new Document({ sections: [{ children: [new Paragraph({ children: [new TextRun('Olá ABNT')] })] }] });
  const buf = await toBuffer(doc);
  const { documentXml } = await readDocx(buf);
  expect(documentXml).toContain('Olá ABNT');
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run tests/exporter/docx.test.ts`
Expected: FAIL — módulos não encontrados.

- [ ] **Step 3: Implementar o exporter**

```ts
// src/exporter/docx.ts
import { Document, Packer } from 'docx';

export function toBuffer(doc: Document): Promise<Buffer> {
  return Packer.toBuffer(doc);
}
```

- [ ] **Step 4: Implementar o helper OOXML**

```ts
// tests/helpers/ooxml.ts
import JSZip from 'jszip';

export type DocxXml = { documentXml: string; stylesXml: string; headerXmls: string[] };

export async function readDocx(buf: Buffer): Promise<DocxXml> {
  const zip = await JSZip.loadAsync(buf);
  const read = async (path: string) => {
    const f = zip.file(path);
    return f ? await f.async('string') : '';
  };
  const headerPaths = Object.keys(zip.files).filter((p) => /^word\/header\d+\.xml$/.test(p));
  const headerXmls = await Promise.all(headerPaths.map(read));
  return {
    documentXml: await read('word/document.xml'),
    stylesXml: await read('word/styles.xml'),
    headerXmls,
  };
}
```

- [ ] **Step 5: Rodar e ver passar**

Run: `npx vitest run tests/exporter/docx.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/exporter/docx.ts tests/helpers/ooxml.ts tests/exporter/docx.test.ts
git commit -m "feat: docx exporter + OOXML test helper"
```

---

## Task 6: `buildSection` — A4, margens, header de paginação

**Files:**
- Create: `src/engine/section.ts`
- Test: `tests/engine/section.test.ts`

- [ ] **Step 1: Escrever o teste que falha**

```ts
// tests/engine/section.test.ts
import { Document } from 'docx';
import { loadRules } from '../../src/rules/load';
import { buildSection } from '../../src/engine/section';
import { toBuffer } from '../../src/exporter/docx';
import { readDocx } from '../helpers/ooxml';

test('seção tem A4, margens 3/3/2/2 e header com número de página à direita', async () => {
  const rules = loadRules('abnt-2024');
  const doc = new Document({ sections: [buildSection(rules, [])] });
  const { documentXml, headerXmls } = await readDocx(await toBuffer(doc));

  expect(documentXml).toMatch(/w:w="11906"/);          // A4 largura
  expect(documentXml).toMatch(/w:h="16838"/);          // A4 altura
  expect(documentXml).toMatch(/w:top="1701"/);         // 3cm
  expect(documentXml).toMatch(/w:left="1701"/);        // 3cm
  expect(documentXml).toMatch(/w:bottom="1134"/);      // 2cm
  expect(documentXml).toMatch(/w:right="1134"/);       // 2cm
  expect(documentXml).toMatch(/w:header="1134"/);      // 2cm do topo

  const header = headerXmls.join('');
  expect(header).toMatch(/w:jc w:val="right"/);        // número à direita
  expect(header).toMatch(/PAGE/);                       // campo de número de página
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run tests/engine/section.test.ts`
Expected: FAIL — `src/engine/section` não existe.

- [ ] **Step 3: Implementar `buildSection`**

```ts
// src/engine/section.ts
import {
  AlignmentType, Header, PageNumber, Paragraph, TextRun,
  type ISectionOptions, type FileChild,
} from 'docx';
import type { ResolvedRules } from '../rules/load';

export function buildSection(rules: ResolvedRules, children: FileChild[]): ISectionOptions {
  const pageNumberPar = new Paragraph({
    alignment: AlignmentType.RIGHT,
    children: [new TextRun({ children: [PageNumber.CURRENT], size: rules.fonts.smallHalfPt, font: rules.fonts.family })],
  });

  return {
    properties: {
      page: {
        size: { width: rules.page.widthTw, height: rules.page.heightTw },
        margin: {
          top: rules.page.margin.top,
          right: rules.page.margin.right,
          bottom: rules.page.margin.bottom,
          left: rules.page.margin.left,
          header: rules.page.headerTw,
        },
      },
    },
    headers: { default: new Header({ children: [pageNumberPar] }) },
    children,
  };
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run tests/engine/section.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/engine/section.ts tests/engine/section.test.ts
git commit -m "feat: buildSection (A4, margins, page-number header)"
```

---

## Task 7: `buildParagraph` + `buildRuns` — corpo e citação curta

**Files:**
- Create: `src/engine/paragraph.ts`, `src/engine/citation.ts` (só `buildCitationText` por ora)
- Test: `tests/engine/paragraph.test.ts`

- [ ] **Step 1: Escrever `buildCitationText` (dependência da citação curta)**

```ts
// src/engine/citation.ts
import type { CitationRef } from '../model/types';
import type { ResolvedRules } from '../rules/load';

// Maiúsc/minúsc (NBR 10520:2023): só primeira letra maiúscula por sobrenome.
const toTitle = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

export function buildCitationText(ref: CitationRef, rules: ResolvedRules): string {
  const authors = ref.authors.map(toTitle);
  let authorPart: string;
  if (authors.length >= rules.citations.etAlFrom) authorPart = `${authors[0]} et al.`;
  else authorPart = authors.join('; ');

  const locator = ref.page ? `, p. ${ref.page}` : ref.location ? `, local. ${ref.location}` : '';
  return `(${authorPart}, ${ref.year}${locator})`;
}
```

- [ ] **Step 2: Escrever o teste que falha (paragraph)**

```ts
// tests/engine/paragraph.test.ts
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
  expect(xml).toContain('“o método é determinístico”'); // aspas curvas “ ”
  expect(xml).toContain('(Silva, 2019, p. 1)');
});
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `npx vitest run tests/engine/paragraph.test.ts`
Expected: FAIL — `buildParagraph` não existe.

- [ ] **Step 4: Implementar `buildParagraph` + `buildRuns`**

```ts
// src/engine/paragraph.ts
import { AlignmentType, Paragraph, TextRun, type IRunOptions } from 'docx';
import type { Paragraph as ParaModel, Run } from '../model/types';
import type { ResolvedRules } from '../rules/load';
import { buildCitationText } from './citation';

export function buildRuns(runs: Run[], rules: ResolvedRules): TextRun[] {
  const base: Pick<IRunOptions, 'font' | 'size' | 'color'> = {
    font: rules.fonts.family, size: rules.fonts.bodyHalfPt, color: rules.fonts.color,
  };
  const out: TextRun[] = [];
  for (const r of runs) {
    if ('kind' in r && r.kind === 'shortCitation') {
      out.push(new TextRun({ ...base, text: `“${r.text}” ` }));
      out.push(new TextRun({ ...base, text: buildCitationText(r.citation, rules) }));
    } else {
      const plain = r as { text: string; italic?: boolean; bold?: boolean };
      out.push(new TextRun({ ...base, text: plain.text, italics: plain.italic, bold: plain.bold }));
    }
  }
  return out;
}

export function buildParagraph(p: ParaModel, rules: ResolvedRules): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    indent: { firstLine: rules.paragraph.firstLineIndentTw },
    spacing: { line: rules.spacing.bodyLine, before: 0, after: 0 },
    children: buildRuns(p.runs, rules),
  });
}
```

- [ ] **Step 5: Rodar e ver passar**

Run: `npx vitest run tests/engine/paragraph.test.ts`
Expected: PASS (2 testes).

- [ ] **Step 6: Commit**

```bash
git add src/engine/citation.ts src/engine/paragraph.ts tests/engine/paragraph.test.ts
git commit -m "feat: buildParagraph + short citation rendering (NBR 10520)"
```

---

## Task 8: `buildHeading` + numeração progressiva

**Files:**
- Create: `src/engine/heading.ts`
- Test: `tests/engine/heading.test.ts`

- [ ] **Step 1: Escrever o teste que falha**

```ts
// tests/engine/heading.test.ts
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

  expect(xml).toContain('1 INTRODUÇÃO');       // caixa alta + número sem ponto
  expect(xml).toContain('1.1 Contexto');       // nível 2 título com iniciais
  expect(xml).toContain('2 DESENVOLVIMENTO');  // contador progride
  expect(xml).not.toContain('1. INTRODUÇÃO');  // nunca ponto após número
  expect(xml).toMatch(/w:b\/>/);               // negrito presente
  expect(xml).toMatch(/w:pageBreakBefore/);    // seção primária em nova página
});

test('SectionCounter incrementa por nível e reseta filhos', () => {
  const c = new SectionCounter();
  expect(c.next(1)).toBe('1');
  expect(c.next(2)).toBe('1.1');
  expect(c.next(2)).toBe('1.2');
  expect(c.next(1)).toBe('2');
  expect(c.next(2)).toBe('2.1');
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run tests/engine/heading.test.ts`
Expected: FAIL — módulo não existe.

- [ ] **Step 3: Implementar `SectionCounter` + `buildHeading`**

```ts
// src/engine/heading.ts
import { AlignmentType, Paragraph, TextRun } from 'docx';
import type { Heading } from '../model/types';
import type { ResolvedRules, TitleStyle } from '../rules/load';

export class SectionCounter {
  private counters = [0, 0, 0, 0, 0];
  next(level: 1|2|3|4|5): string {
    this.counters[level - 1]++;
    for (let i = level; i < 5; i++) this.counters[i] = 0;
    return this.counters.slice(0, level).join('.');
  }
}

function applyCase(text: string, c: TitleStyle['case']): string {
  if (c === 'uppercase') return text.toUpperCase();
  if (c === 'sentence') return text.charAt(0).toUpperCase() + text.slice(1);
  return text; // 'title': mantém o texto como veio do modelo (iniciais já tratadas na origem)
}

export function buildHeading(h: Heading, counter: SectionCounter, rules: ResolvedRules): Paragraph {
  const number = counter.next(h.level);
  const style = rules.sections.titleStylesByLevel[h.level];
  const label = `${number} ${applyCase(h.text, style.case)}`; // separador: um espaço, sem pontuação
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    pageBreakBefore: h.level === 1, // seção primária inicia em nova página
    spacing: { line: rules.spacing.bodyLine, before: 0, after: 0 },
    children: [new TextRun({
      text: label, font: rules.fonts.family, size: rules.fonts.bodyHalfPt,
      color: rules.fonts.color, bold: style.bold, italics: style.italic,
    })],
  });
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run tests/engine/heading.test.ts`
Expected: PASS (2 testes).

- [ ] **Step 5: Commit**

```bash
git add src/engine/heading.ts tests/engine/heading.test.ts
git commit -m "feat: buildHeading + progressive numbering (NBR 6024)"
```

---

## Task 9: `buildLongCitation` + `et al.`

**Files:**
- Modify: `src/engine/citation.ts`
- Test: `tests/engine/citation.test.ts`

- [ ] **Step 1: Escrever o teste que falha**

```ts
// tests/engine/citation.test.ts
import { Document } from 'docx';
import { loadRules } from '../../src/rules/load';
import { buildSection } from '../../src/engine/section';
import { buildLongCitation, buildCitationText } from '../../src/engine/citation';
import { toBuffer } from '../../src/exporter/docx';
import { readDocx } from '../helpers/ooxml';

test('buildCitationText usa et al. a partir de 4 autores', () => {
  const rules = loadRules('abnt-2024');
  const four = buildCitationText({ authors: ['SILVA','SOUZA','LIMA','COSTA'], year: '2020' }, rules);
  expect(four).toBe('(Silva et al., 2020)');
  const three = buildCitationText({ authors: ['SILVA','SOUZA','LIMA'], year: '2020' }, rules);
  expect(three).toBe('(Silva; Souza; Lima, 2020)');
});

test('citação longa: bloco recuo 4cm, 10pt, 1,0, sem aspas', async () => {
  const rules = loadRules('abnt-2024');
  const block = buildLongCitation(
    { kind: 'longCitation', text: 'Trecho longo da citação com mais de quatro linhas.',
      citation: { authors: ['SILVA'], year: '2019', page: '42' } }, rules);
  const doc = new Document({ sections: [buildSection(rules, [block])] });
  const xml = (await readDocx(await toBuffer(doc))).documentXml;

  expect(xml).toMatch(/w:left="2268"/);   // recuo 4cm
  expect(xml).toMatch(/w:line="240"/);    // 1,0
  expect(xml).toMatch(/w:sz w:val="20"/); // 10pt
  expect(xml).not.toContain('“');    // sem aspas
  expect(xml).toContain('(Silva, 2019, p. 42)');
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run tests/engine/citation.test.ts`
Expected: FAIL — `buildLongCitation` não existe.

- [ ] **Step 3: Adicionar `buildLongCitation` em `src/engine/citation.ts`**

```ts
// adicionar ao topo de src/engine/citation.ts:
import { AlignmentType, Paragraph, TextRun } from 'docx';
import type { LongCitation } from '../model/types';

// adicionar ao fim do arquivo:
export function buildLongCitation(block: LongCitation, rules: ResolvedRules): Paragraph {
  const small = rules.fonts.smallHalfPt;
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    indent: { left: rules.citations.longIndentTw },
    spacing: { line: rules.spacing.singleLine, before: 0, after: 0 },
    children: [
      new TextRun({ text: `${block.text} `, font: rules.fonts.family, size: small, color: rules.fonts.color }),
      new TextRun({ text: buildCitationText(block.citation, rules), font: rules.fonts.family, size: small, color: rules.fonts.color }),
    ],
  });
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run tests/engine/citation.test.ts`
Expected: PASS (2 testes).

- [ ] **Step 5: Commit**

```bash
git add src/engine/citation.ts tests/engine/citation.test.ts
git commit -m "feat: buildLongCitation block (NBR 10520) + et al. rule"
```

---

## Task 10: `buildReferences` — título + ordenação + bloco

**Files:**
- Create: `src/engine/references.ts`
- Test: `tests/engine/references.test.ts`

- [ ] **Step 1: Escrever o teste que falha**

```ts
// tests/engine/references.test.ts
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
  expect(xml).toMatch(/w:jc w:val="center"[\s\S]*REFERÊNCIAS/); // título centralizado
  // ordem: ALMEIDA antes de SOUZA
  expect(xml.indexOf('Obra A.')).toBeLessThan(xml.indexOf('Obra Z.'));
  expect(xml).toMatch(/w:line="240"/);  // 1,0
  expect(xml).toMatch(/w:jc w:val="left"/); // entradas à esquerda
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run tests/engine/references.test.ts`
Expected: FAIL — módulo não existe.

- [ ] **Step 3: Implementar `buildReferences`**

```ts
// src/engine/references.ts
import { AlignmentType, Paragraph, TextRun } from 'docx';
import type { Reference } from '../model/types';
import type { ResolvedRules } from '../rules/load';
import { buildRuns } from './paragraph';

export function buildReferences(refs: Reference[], rules: ResolvedRules): Paragraph[] {
  const title = new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { line: rules.spacing.bodyLine, before: 0, after: 0 },
    children: [new TextRun({
      text: 'REFERÊNCIAS', font: rules.fonts.family, size: rules.fonts.bodyHalfPt,
      color: rules.fonts.color, bold: rules.unnumberedTitles.bold,
    })],
  });

  const sorted = [...refs].sort((a, b) => a.sortKey.localeCompare(b.sortKey, 'pt-BR'));
  const entries: Paragraph[] = [];
  for (const ref of sorted) {
    entries.push(new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { line: rules.spacing.singleLine, before: 0, after: 0 },
      children: buildRuns(ref.runs, rules),
    }));
    entries.push(new Paragraph({ children: [] })); // linha em branco entre referências
  }
  return [title, ...entries];
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run tests/engine/references.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/engine/references.ts tests/engine/references.test.ts
git commit -m "feat: buildReferences (title + alphabetical order + block format)"
```

---

## Task 11: Orquestrador `build` + dispatch de blocos

**Files:**
- Create: `src/engine/build.ts`
- Test: `tests/engine/build.test.ts`

- [ ] **Step 1: Escrever o teste que falha**

```ts
// tests/engine/build.test.ts
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
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run tests/engine/build.test.ts`
Expected: FAIL — `build` não existe.

- [ ] **Step 3: Implementar `build`**

```ts
// src/engine/build.ts
import { Document, type FileChild } from 'docx';
import type { StructuredDocument, Block } from '../model/types';
import { applyOverrides, type ResolvedRules } from '../rules/load';
import { buildSection } from './section';
import { buildParagraph } from './paragraph';
import { buildHeading, SectionCounter } from './heading';
import { buildLongCitation } from './citation';
import { buildReferences } from './references';

export function build(model: StructuredDocument, baseRules: ResolvedRules): Document {
  const rules = applyOverrides(baseRules, model.overrides);
  const counter = new SectionCounter();
  const children: FileChild[] = [];

  for (const block of model.body as Block[]) {
    if (block.kind === 'heading') children.push(buildHeading(block, counter, rules));
    else if (block.kind === 'paragraph') children.push(buildParagraph(block, rules));
    else if (block.kind === 'longCitation') children.push(buildLongCitation(block, rules));
  }

  if (model.references.length > 0) children.push(...buildReferences(model.references, rules));

  return new Document({ sections: [buildSection(rules, children)] });
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run tests/engine/build.test.ts`
Expected: PASS (2 testes).

- [ ] **Step 5: Commit**

```bash
git add src/engine/build.ts tests/engine/build.test.ts
git commit -m "feat: build orchestrator (block dispatch + overrides)"
```

---

## Task 12: Fixture de integração + suíte completa

**Files:**
- Create: `fixtures/integration.ts`
- Test: `tests/integration.test.ts`

- [ ] **Step 1: Criar o fixture de integração**

```ts
// fixtures/integration.ts
import type { StructuredDocument } from '../src/model/types';

// Trabalho fake: seções multi-nível, citação curta + longa, refs desordenadas.
export const integrationDoc: StructuredDocument = {
  body: [
    { kind: 'heading', level: 1, text: 'Introdução' },
    { kind: 'paragraph', runs: [
      { text: 'A formatação ABNT é determinística. ' },
      { kind: 'shortCitation', text: 'regra não é geração', citation: { authors: ['SILVA'], year: '2019', page: '1' } },
    ] },
    { kind: 'heading', level: 2, text: 'Objetivos' },
    { kind: 'paragraph', runs: [{ text: 'Definir o motor.' }] },
    { kind: 'heading', level: 1, text: 'Desenvolvimento' },
    { kind: 'longCitation', text: 'Bloco de citação longa com mais de quatro linhas de conteúdo textual.',
      citation: { authors: ['SOUZA','LIMA','COSTA','REIS'], year: '2021', page: '10' } },
  ],
  references: [
    { sortKey: 'SOUZA', runs: [{ text: 'SOUZA, B. ', bold: false }, { text: 'Título Z', bold: true }, { text: '. Editora, 2021.' }] },
    { sortKey: 'ALMEIDA', runs: [{ text: 'ALMEIDA, A. ', bold: false }, { text: 'Título A', bold: true }, { text: '. Editora, 2019.' }] },
  ],
};
```

- [ ] **Step 2: Escrever o teste de integração**

```ts
// tests/integration.test.ts
import { loadRules } from '../src/rules/load';
import { build } from '../src/engine/build';
import { toBuffer } from '../src/exporter/docx';
import { readDocx } from './helpers/ooxml';
import { integrationDoc } from '../fixtures/integration';

test('pipeline ponta a ponta produz .docx conforme', async () => {
  const { documentXml, headerXmls } = await readDocx(await toBuffer(build(integrationDoc, loadRules('abnt-2024'))));

  // estrutura e numeração
  expect(documentXml).toContain('1 INTRODUÇÃO');
  expect(documentXml).toContain('1.1 Objetivos');
  expect(documentXml).toContain('2 DESENVOLVIMENTO');
  // citações
  expect(documentXml).toContain('(Silva, 2019, p. 1)');
  expect(documentXml).toContain('(Souza et al., 2021, p. 10)'); // 4 autores → et al.
  // referências ordenadas (ALMEIDA antes de SOUZA)
  expect(documentXml.indexOf('Título A')).toBeLessThan(documentXml.indexOf('Título Z'));
  // formatação base presente
  expect(documentXml).toMatch(/w:top="1701"/);
  expect(headerXmls.join('')).toMatch(/PAGE/);
});
```

- [ ] **Step 3: Rodar e ver passar**

Run: `npx vitest run tests/integration.test.ts`
Expected: PASS.

- [ ] **Step 4: Rodar a suíte inteira + typecheck**

Run: `npm test && npm run typecheck`
Expected: todos os testes PASS; `tsc --noEmit` sem erros.

- [ ] **Step 5: Commit**

```bash
git add fixtures/integration.ts tests/integration.test.ts
git commit -m "test: end-to-end integration fixture covering full pipeline"
```

---

## Mapa checklist (spec §12) → tarefas

| Item do checklist | Task |
|---|---|
| A4 + margens 3/3/2/2 | 6 |
| Fonte TNR/Arial 12 preto | 7 (corpo), 3 (resolução) |
| 1,5 corpo / 1,0 exceções | 7, 9, 10 |
| Recuo 1,25cm + justificado | 7 |
| Paginação arábica topo-direito 2cm | 6 |
| Numeração de seção sem ponto; primária nova página | 8 |
| Estilo tipográfico por nível | 8 |
| Citação curta com aspas; longa bloco 4cm/10pt/1,0 | 7, 9 |
| Autor-data Maiúsc/minúsc; et al. 4+ | 7, 9 |
| Referências esquerda/1,0/linha em branco/alfabética | 10 |
| Override válido aplicado; inválido rejeitado | 4, 11 |
| Exportação `.docx` | 5 |

**Fora deste plano (próximo spec):** sumário, resumo, capa, folha de rosto, offset fino de paginação, reconstrução de referência por tipo, renderização de sistema numérico, parser, tela de revisão, qualquer IA/API, `.pdf`.
