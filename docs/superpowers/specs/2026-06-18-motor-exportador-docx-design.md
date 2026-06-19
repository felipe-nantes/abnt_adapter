# Design — Motor determinístico + Exportador `.docx` (Step 1)

> Spec do primeiro slice do MVP do Formatador ABNT. Perfil **ABNT-2024**.
> Fonte da verdade dos valores: `config/abnt-2024.rules.json`. Critérios de aceite: `docs/REGRAS_MVP_ABNT.md`.
> Data: 2026-06-18.

## Objetivo

Construir o núcleo determinístico do produto: dado um **modelo estruturado** de entrada (via fixtures nesta fase, sem parser) e o perfil de regras JSON, gerar um `.docx` em conformidade ABNT, com **todos os testes de formatação do slice passando** (assertando no XML OOXML final).

Este slice fecha a base testável antes de encarar parser, tela de revisão e elementos pré-textuais.

## Decisões travadas

| Dimensão | Decisão |
|---|---|
| Fatia | Motor determinístico + exportador `.docx` (Step 1 do build order) |
| Runtime | TypeScript + lib `docx` (Node) |
| Repo | Pacote TS único, layout `src/` do CLAUDE.md |
| Validação | Zod (carga do JSON + bordas) |
| Testes | Vitest; gerar `.docx` → descompactar (zip) → assertar no XML OOXML |
| Escopo de regras | Corpo + pós-textual (referências). **Pré-textual fora** (capa, folha de rosto, sumário, resumo) → próximo spec |

## Restrição de custo (herdada do MVP)

Zero API paga, zero LLM. Stack só: TypeScript + Vitest + `docx` + Zod. Saída só `.docx` (PDF é fase posterior). Qualquer coisa que exija API/LLM **não pertence a este slice**.

---

## 1. Arquitetura e fronteiras de módulo

```
config/abnt-2024.rules.json     # fonte da verdade (já existe)
src/model/                      # tipos do StructuredDocument — SEM lógica
src/rules/                      # carrega+valida o JSON, converte unidades (cm→twips, pt→half-pt)
src/engine/                     # core: (modelo + regras) → docx.Document
src/exporter/                   # serializa docx.Document → Buffer .docx
tests/                          # 1 teste por item do checklist + helper OOXML
fixtures/                       # modelos estruturados de entrada (sem parser nesta fase)
```

**Fluxo de dados:**
```
fixture (StructuredDocument)  ─┐
                               ├─► engine.build(model, rules) ─► docx.Document ─► exporter.toBuffer() ─► .docx
rules.load('abnt-2024')       ─┘
```

**Princípios das fronteiras:**
- `model/` é só tipos → engine e (futuro) parser compartilham o mesmo contrato.
- `rules/` isola toda conversão de unidade num lugar → testável sozinho; o resto do código nunca vê twips "mágicos".
- **Engine produz objetos da lib `docx` direto** — sem árvore intermediária neutra (YAGNI; só há um formato de saída no MVP; PDF futuro virá do `.docx`).

---

## 2. Modelo estruturado (`src/model/`)

Contrato de entrada do engine. Nesta fase vem de fixtures; depois o parser produz o mesmo tipo.

```ts
type StructuredDocument = {
  overrides?: ProfileOverrides;   // campo de regras customizadas (MVP: parametrizado)
  body: Block[];                  // elementos textuais (corpo)
  references: Reference[];        // pós-textual
};

type Block =
  | Heading        // título de seção numerada
  | Paragraph      // parágrafo de corpo (justificado, recuo 1,25cm)
  | LongCitation;  // citação ≥4 linhas (bloco 4cm, 10pt, 1,0, sem aspas)

type Heading      = { kind: 'heading'; level: 1|2|3|4|5; text: string };
type Paragraph    = { kind: 'paragraph'; runs: Run[] };
type LongCitation = { kind: 'longCitation'; text: string; citation: CitationRef };

type Run =
  | { text: string; italic?: boolean; bold?: boolean }
  | ShortCitation;   // citação curta inline

type ShortCitation = {
  kind: 'shortCitation';
  text: string;            // texto citado (vai entre aspas duplas)
  citation: CitationRef;
};

type CitationRef = {
  authors: string[];       // sobrenomes; engine aplica Maiúsc/minúsc + et al. (4+)
  year: string;
  page?: string;           // → "p. X"
  location?: string;       // → "local." (não paginado)
};

type Reference = {
  sortKey: string;         // sobrenome p/ ordenação alfabética (engine ordena)
  runs: Run[];             // conteúdo já com ênfases (negrito no título etc.)
};

type ProfileOverrides = {
  fontFamily?: 'Times New Roman' | 'Arial';
  citationSystem?: 'author-date' | 'numeric';
  titleStylesByLevel?: Partial<Record<1|2|3|4|5, TitleStyle>>;
  margins?: { top?: number; left?: number; bottom?: number; right?: number }; // cm
};
```

**Decisões deterministas embutidas (responsabilidade do engine, não do modelo):**
- **Numeração progressiva** (1, 1.1, 1.1.1) calculada pelo engine a partir de `level`. Modelo NÃO carrega número. — NBR 6024.
- **Parenteticação autor-data** (`(Silva, 2019, p. 1)`, `et al.` com 4+ autores, Maiúsc/minúsc) montada pelo engine a partir de `CitationRef`. — NBR 10520:2023.
- **Ordenação de referências** feita pelo engine por `sortKey`. `Reference.runs` já vem com ênfases porque a reconstrução completa por tipo de fonte (NBR 6023) é fase com IA — aqui só formatamos bloco + ordenamos.
- **Título `REFERÊNCIAS`** (não-numerado, centralizado) emitido automaticamente pelo engine lendo `unnumberedTitles` do JSON. Modelo só fornece a lista.

---

## 3. Camada de regras (`src/rules/`)

Responsabilidade única: carregar o JSON, validar, e expor valores já convertidos pra unidade da lib `docx`.

```ts
loadRules(profile: 'abnt-2024'): ResolvedRules
applyOverrides(rules: ResolvedRules, overrides?: ProfileOverrides): ResolvedRules
```

- **Validação de shape**: JSON validado na carga com **Zod** (schema único → tipo TS + erro claro se o JSON quebrar).
- **Conversão centralizada**: `cm→twips (×566.93, arredondado)`, `pt→half-points (×2)`, espaçamento `1.5→line:360`, `1.0→240`. Tudo aqui; engine consome `ResolvedRules` em twips/half-pt.
- **Overrides do MVP** (`fonts.defaultFamily`, `citations.system`, `sections.titleStylesByLevel`, `page.margins`): `applyOverrides` aplica e valida contra a norma. Override que viola (ex.: margem abaixo do mínimo) → rejeitado com mensagem clara.

---

## 4. Engine (`src/engine/`)

`build(model: StructuredDocument, rules: ResolvedRules): docx.Document`. Decomposto em sub-builders pequenos, um por preocupação:

- `buildSection(rules)` → `sectPr`: A4, margens, paginação (header número arábico topo-direito a 2cm).
- `buildHeading(heading, counter, rules)` → numeração progressiva + estilo por nível (caixa/negrito/itálico); seção primária em nova página; sem ponto após o número.
- `buildParagraph(paragraph, rules)` → justificado, recuo 1ª linha 1,25cm, entrelinha 1,5; resolve runs (incl. citação curta com aspas duplas).
- `buildLongCitation(block, rules)` → bloco recuo esquerdo 4cm, 10pt, 1,0, sem aspas.
- `buildCitationText(ref, rules)` → string `(Silva, 2019, p. 1)`; `et al.` a partir de 4 autores (itálico); `p.`/`local.`; sem ponto final entre texto e citação. **Sistema autor-data é o implementado neste slice**; `citationSystem: 'numeric'` é aceito como valor de override válido (não rejeitado), mas a renderização numérica completa fica para spec posterior.
- `buildReferences(refs, rules)` → título `REFERÊNCIAS` centralizado + ordena por `sortKey` + cada entrada 1,0, alinhada à esquerda, linha em branco entre elas.

**Paginação — gancho adiado:** o cálculo fino do offset (contagem começa na folha de rosto, exibe da Introdução, exclui verso da folha de rosto) depende do pré-textual, que está fora deste slice. O engine expõe um gancho `pageNumberStart`; neste slice o corpo numera já visível. A regra completa fecha no spec pré-textual.

---

## 5. Testes, fixtures e erros

**Helper OOXML** (`tests/helpers/docx.ts`): recebe Buffer `.docx`, descompacta (zip), retorna `document.xml`/`styles.xml` parseados pra query. Asserts em valores reais (`pgMar top=1701`, `line=360`, `jc=both`, `ind firstLine=709`, `sz=24`, etc.).

**Um teste por item do checklist** (deste slice):
- A4 + margens 3/3/2/2 cm.
- Fonte TNR/Arial 12 pt, preto.
- Entrelinha 1,5 corpo / 1,0 exceções.
- Recuo 1ª linha 1,25cm + corpo justificado.
- Paginação arábica, topo-direito, 2cm (com gancho de offset).
- Numeração de seção sem ponto após número; primária em nova página.
- Estilo tipográfico por nível de título.
- Citação curta com aspas duplas; longa em bloco 4cm/10pt/1,0/sem aspas.
- Autoria autor-data Maiúsc/minúsc; `et al.` a partir de 4 autores.
- Referências à esquerda, 1,0, linha em branco entre, ordem alfabética.
- Override válido aplicado; override inválido rejeitado.

*(Fora deste slice, no próximo spec: sumário, resumo, capa, folha de rosto.)*

**Fixtures** (`fixtures/`):
- (a) Conjunto mínimo focado por regra.
- (b) Um fixture de integração — trabalho fake com seções multi-nível, citação curta + longa, e lista de referências desordenada — exercitando o pipeline ponta a ponta.

**Erros:**
- JSON inválido na carga → erro de validação Zod claro (falha cedo).
- Override que viola norma → rejeitado com mensagem (ex.: `"margem 1.5cm < mínimo 2cm"`).
- Modelo malformado → erro de tipo na borda (Zod no fixture loader).

**Stack de dev:** TypeScript + Vitest + `docx` + Zod. Nada além disso.

---

## Limites deste slice (escopo explícito)

- **Inclui:** todas as regras de formatação de corpo + bloco de referências (formatação/ordenação), com testes OOXML.
- **Não inclui:** parser/estruturador, tela de revisão, elementos pré-textuais (capa/folha de rosto/sumário/resumo), cálculo fino de offset de paginação, reconstrução de referência por tipo (NBR 6023), qualquer IA/API, exportação `.pdf`.
- Cada item adiado tem seu próprio spec futuro.
