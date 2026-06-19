# Regras de Formatação ABNT — Spec do MVP

> Especificação implementável do motor determinístico. Cada regra traz **valor**, **norma de origem** e **critério de aceite** (que vira teste automatizado). A fonte única da verdade dos valores é `abnt-2024.rules.json` — este documento explica e justifica cada um.
>
> Perfil: **ABNT-2024** · Versões: NBR 14724:2024 · NBR 10520:2023 · NBR 6023:2018 · NBR 6024:2012 · NBR 6027:2012 · NBR 6028:2021.
>
> ⚠️ **Confirmar a versão da NBR 6023 no catálogo oficial da ABNT** antes do build (a maioria das fontes indica 2018/2020; algumas mencionam 2025).

---

## Como ler esta spec

Cada bloco de regra segue o formato: **Regra → Valor → Norma → Aceite**. O "Aceite" é escrito para virar teste: gere um `.docx`, abra-o programaticamente e verifique a propriedade.

**Unidades e conversão (importante para o build):**
- Distâncias em **cm**, fontes em **pt**, espaçamento como **multiplicador** (1,0 / 1,5).
- Saída `.docx`: 1 cm ≈ **566,93 twips**; tamanho de fonte em **half-points** (12 pt → `size: 24`); recuos/margens em **twips**.
- Lib recomendada (Node): `docx`. Alternativa (Python): `python-docx` (`Cm()`, `Pt()`).

---

## 0. Restrição de custo — MVP sem API

**O MVP roda 100% com código e ferramentas open source, sem nenhuma API paga nem chamada a LLM.** Isso mantém o custo de operação o mais próximo de zero para iniciar.

- **Sem LLM / sem API de IA** em qualquer etapa do MVP. Toda a formatação é determinística; a estruturação é por **heurística (regex/regras)**; o preenchimento de dados pré-textuais é **manual + pré-preenchimento por regex** (nunca por IA no MVP).
- **Stack 100% open source / sem licença:** lib `docx` (ou `python-docx`) para gerar o `.docx`. Nada disso cobra por uso.
- **Saída do MVP: apenas `.docx`.** A exportação `.pdf` fica para fase posterior. Sem PDF, o MVP **dispensa o binário do LibreOffice e pode rodar em serverless puro** (ex.: Vercel free tier), sem VPS — infra ainda mais simples e barata.
- **Pagamento/assinatura (Stripe):** sem custo fixo — só cobra **percentual por transação**, ou seja, você só paga quando recebe. Auth pode usar solução open source ou free tier.
- **O que custa API entra só nas fases posteriores** (correção/reescrita, sugestão de citações/referências, extração pré-textual por IA) e fica atrás de plano pago, cobrindo o custo de uso.

> Regra para o build: se uma feature do MVP exigir chamar uma API externa ou um LLM, **ela não pertence ao MVP** — mova para a fase seguinte.

---

## 1. Página

- **Tamanho:** A4 (21 × 29,7 cm). — NBR 14724:2024.
- **Margens:** superior **3 cm**, esquerda **3 cm**, inferior **2 cm**, direita **2 cm**. — NBR 14724:2024.
- **Aceite:** `sectPr` do documento tem `pgSz` A4 e `pgMar` top=1701tw, left=1701tw, bottom=1134tw, right=1134tw (±2tw).

## 2. Fonte

- **Família:** Times New Roman **ou** Arial (mesma fonte em todo o trabalho). Default: Times New Roman. — NBR 14724:2024.
- **Cor:** preta no corpo. — NBR 14724:2024.
- **Tamanhos:** corpo **12 pt**; citação longa, nota de rodapé, legendas/fontes de ilustrações e tabelas, ficha catalográfica e nota de natureza **10 pt**.
- **Aceite:** todo run do corpo é 12 pt na família escolhida; runs de citação longa/rodapé/legenda são 10 pt; nenhuma cor de fonte ≠ preta no corpo.

## 3. Espaçamento

- **Corpo:** entrelinhas **1,5**. — NBR 14724:2024.
- **Simples (1,0):** citações longas, notas de rodapé, referências (dentro de cada uma), legendas/fontes, ficha catalográfica, nota de natureza.
- **Antes/depois do parágrafo:** 0 pt.
- **Entre referências:** uma linha em branco.
- **Aceite:** parágrafos do corpo com `line=360` (1,5) e `spacing before/after = 0`; parágrafos de citação longa/rodapé/referência com `line=240` (1,0).

## 4. Parágrafo

- **Recuo da primeira linha:** **1,25 cm**. — NBR 14724:2024 (convenção consolidada).
- **Alinhamento:** justificado (corpo). Referências: à esquerda.
- **Aceite:** parágrafos do corpo têm `firstLine ≈ 709tw` e `jc=both`; parágrafos de referência têm `jc=left` e sem recuo de primeira linha.

## 5. Paginação

- **Formato:** algarismos arábicos. — NBR 14724:2024.
- **Posição:** canto **superior direito**, a **2 cm** da borda superior.
- **Contagem:** começa na **folha de rosto**. A **capa não é contada**.
- **Exibição:** o número só **aparece a partir da primeira página textual** (Introdução).
- **Mudança 2024:** o **verso da folha de rosto (ficha catalográfica) NÃO é contado nem numerado**.
- **Aceite:** páginas pré-textuais sem número visível; primeira página da Introdução exibe o número correto considerando que a contagem iniciou na folha de rosto e que o verso da folha de rosto foi excluído; número no header à direita.

## 6. Seções e numeração progressiva (NBR 6024)

- **Numeração:** arábica e progressiva (1, 1.1, 1.1.1…).
- **Separador número↔título:** **apenas um espaço, sem pontuação**. Ex.: `1 INTRODUÇÃO` (nunca `1. INTRODUÇÃO`).
- **Seção primária:** inicia em **nova página**.
- **Alinhamento dos títulos numerados:** à esquerda.
- **Diferenciação tipográfica (default, configurável):**
  - Nível 1: CAIXA ALTA + negrito
  - Nível 2: Título Com Iniciais + negrito
  - Nível 3: Sentença (1ª maiúscula) + negrito
  - Nível 4: Sentença + itálico
  - Nível 5: Sentença + regular
- **Consistência:** a diferenciação deve ser idêntica no texto e no sumário. — NBR 14724:2024 / NBR 6024.
- **Títulos sem indicativo numérico** (RESUMO, ABSTRACT, SUMÁRIO, REFERÊNCIAS, AGRADECIMENTOS, APÊNDICES, ANEXOS…): **centralizados**.
- **Aceite:** nenhum título numerado tem ponto após o número; seção primária sempre começa em nova página; estilo por nível bate com o perfil; títulos sem indicativo numérico estão centralizados.

## 7. Citações (NBR 10520:2023)

- **Curta (até 3 linhas):** no corpo, entre **aspas duplas** (aspas simples para citação interna).
- **Longa (4 linhas ou mais):** bloco com **recuo de 4 cm** da margem esquerda, **fonte 10 pt**, **espaçamento simples**, **sem aspas**.
- **Sistema:** autor-data (default) ou numérico — consistente em todo o trabalho.
- **Autoria pessoa física entre parênteses:** **Maiúsc/minúsc**. Ex.: `(Silva, 2019, p. 1)` — mudança de 2023, não usar `(SILVA, 2019)`.
- **et al.:** a partir de **4 autores** (em itálico).
- **Sem ponto final** entre o conteúdo e a citação.
- **Paginação/localização:** `p.` para página; `local.` para e-books/documentos não paginados.
- **Aceite:** bloco de citação longa com recuo esquerdo ≈ 2268tw, 10 pt, 1,0 e sem aspas; citações no corpo com aspas duplas; autoria entre parênteses em Maiúsc/minúsc; `et al.` apenas com 4+ autores.

## 8. Referências (NBR 6023)

- **Alinhamento:** à esquerda.
- **Espaçamento:** simples dentro de cada referência; **linha em branco** entre referências.
- **Ordem:** alfabética pelo sobrenome.
- **Sobrenome do autor:** caixa alta na lista (convenção).
- **Título principal da obra:** em negrito.
- **Escopo MVP:** o motor **garante a formatação de bloco** (alinhamento, espaçamento, ordenação) e normalização leve. A **reconstrução completa por tipo de fonte** (livro, artigo, site, lei…) fica para a fase com IA + verificação (ver limites, §11).
- **Aceite:** lista de referências alinhada à esquerda, cada entrada em 1,0 com linha em branco entre elas, ordenadas alfabeticamente.

## 9. Elementos pré-textuais

- **Preenchimento (MVP, sem IA):** os dados (autor, título, instituição etc.) vêm de **formulário manual**, com **pré-preenchimento por heurística regex** quando detectáveis no texto. Extração assistida por IA é fase posterior.
- **Capa** (obrigatória, centralizada): instituição, autor, título (e subtítulo), local, ano. Não entra na paginação.
- **Folha de rosto:** inicia a contagem de páginas; contém a **nota de natureza** recuada (≈ do meio para a direita), espaçamento simples, 10 pt.
- **Resumo (NBR 6028:2021):** parágrafo único; `Palavras-chave:` separadas por `;` e finalizadas por `.`.
- **Sumário (NBR 6027:2012):** título `SUMÁRIO` centralizado; lista **apenas** elementos textuais e pós-textuais (pré-textuais não entram); diferenciação tipográfica idêntica à do texto.
- **Aceite:** ordem dos elementos conforme `structureOrder`; sumário não lista pré-textuais; resumo em parágrafo único com palavras-chave no formato correto.

## 10. Campo de regras customizadas (MVP)

No MVP, regras do usuário são **overrides parametrizados** dos valores do perfil — não texto livre interpretado por IA (isso entra na Fase 1). Overrides suportados no MVP: família de fonte, sistema de citação (autor-data/numérico), esquema tipográfico de títulos, margens. **Todo override é validado contra a norma** para não criar conflito (ex.: não permitir margem < mínimo).

- **Aceite:** um override válido altera o parâmetro correspondente na saída; um override que viola a norma é rejeitado com mensagem clara.

---

## 11. Limites honestos do MVP (escopo)

Deixar isto explícito evita prometer o que o determinístico não entrega e orienta o que cai na tela de revisão:

1. **Garantido 100% (determinístico):** todas as regras de **formatação** acima (margens, fonte, espaçamento, recuo, paginação, numeração de seções, blocos de citação, formatação de bloco da lista de referências).
2. **Depende de detecção (tela de revisão):** identificar, no texto cru, **o que é cada coisa** (título de seção e seu nível, citação longa, início da lista de referências, elementos pré-textuais). No MVP isso usa heurísticas; onde a confiança for baixa, vai para confirmação do usuário.
3. **Adiado para fase com IA + verificação:** reconstrução completa de cada referência por tipo (NBR 6023), interpretação de regras customizadas em texto livre, extração de dados pré-textuais por IA, sugestão/inserção de citações e referências (sempre com verificação de fonte antes de inserir). **Tudo que depende de API/LLM fica nesta camada — fora do MVP.**
4. **Adiado por simplicidade de infra:** exportação `.pdf` (fase posterior). O MVP entrega **somente `.docx`**; sem o binário do LibreOffice, roda em serverless puro.

**Posicionamento:** prometer "formatação ABNT garantida", com a estruturação revisável pelo usuário antes da exportação.

---

## 12. Checklist de aceite do MVP (vira suíte de testes)

- [ ] Página A4 com margens 3/3/2/2 cm.
- [ ] Corpo em Times New Roman/Arial 12 pt, preto.
- [ ] Entrelinhas 1,5 no corpo; 1,0 nos elementos de exceção.
- [ ] Recuo de primeira linha 1,25 cm; corpo justificado.
- [ ] Paginação arábica, topo-direita, 2 cm; conta da folha de rosto, exibe da Introdução, exclui verso da folha de rosto.
- [ ] Numeração de seções sem ponto após o número; primária em nova página.
- [ ] Esquema tipográfico de títulos consistente entre texto e sumário.
- [ ] Citação curta entre aspas; longa em bloco 4 cm / 10 pt / 1,0 / sem aspas.
- [ ] Autoria entre parênteses em Maiúsc/minúsc; `et al.` a partir de 4 autores.
- [ ] Referências à esquerda, 1,0, linha em branco entre elas, ordem alfabética.
- [ ] Sumário centralizado, sem elementos pré-textuais.
- [ ] Resumo em parágrafo único com palavras-chave no formato correto.
- [ ] Override válido aplicado; override inválido rejeitado.
- [ ] Exportação `.docx` (única saída do MVP; `.pdf` é fase posterior).

---

*Valores conforme vigência em jun/2026; confirmar no catálogo oficial da ABNT antes de implementar.*
