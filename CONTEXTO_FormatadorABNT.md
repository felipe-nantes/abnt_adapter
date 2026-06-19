# Formatador ABNT — Documento de Contexto da Aplicação

> Documento-base de produto. Reúne visão, escopo, arquitetura, normas envolvidas, riscos e roadmap. Serve tanto para alinhar a ideia quanto para alimentar o desenvolvimento (inclusive fluxos de Claude Code).

---

## 1. Visão geral

Aplicação que recebe um texto (acadêmico ou não) e devolve um documento **integralmente formatado segundo as normas ABNT de trabalhos acadêmicos**, em `.docx` ou `.pdf`, à escolha do usuário. A formatação precisa ser rápida e, acima de tudo, **confiável**: independentemente da qualidade do texto de entrada, a saída deve estar enquadrada nas normas.

Além da formatação, o sistema oferece uma camada opcional de **edição e enriquecimento por IA**: correção de ortografia/gramática, reescrita (quando o usuário autorizar), inserção de citações e referências que agreguem ao texto e, se desejado, geração de partes faltantes. Há também um **campo de regras customizadas**, onde o usuário lista exigências específicas (da instituição, do orientador ou pessoais) que o sistema deve respeitar.

**Resumo das decisões já tomadas:**

| Decisão | Definição |
|---|---|
| Plataforma | Web no MVP; apps iOS e Android na versão final |
| Saída | **MVP: apenas `.docx`** — `.pdf` em fase posterior |
| Escopo ABNT | Trabalho acadêmico completo (capa, sumário, citações, referências etc.) |
| Dados pré-textuais | Modelo misto (IA extrai + usuário confirma); upload de template da instituição quando necessário |
| Citações/referências | IA pode buscar e inferir **se o usuário quiser**; se já existirem, apenas formata. Tudo que a IA gerar **deve ser verificado** |
| Formatação | Motor **determinístico** no MVP; IA entra nas features de edição/enriquecimento |
| Monetização | Assinatura mensal |

---

## 2. Problema e proposta de valor

Formatar na ABNT é uma dor real e recorrente: margens, espaçamento, fonte, recuos, numeração progressiva, sumário automático, citações no padrão autor-data e referências em ordem alfabética consomem horas e geram retrabalho — frequentemente às vésperas da entrega. As normas ainda **mudam** (a NBR 14724 foi revisada em 2024 e a NBR 10520 em 2023), o que faz boa parte do material disponível online ficar desatualizado e induzir o estudante ao erro.

**Proposta de valor:** transformar um texto cru em um documento pronto para entrega, em minutos, com garantia de conformidade de formatação e — opcionalmente — com melhoria de conteúdo assistida por IA com fontes verificáveis. O diferencial é a combinação de **confiabilidade determinística** (a formatação não "alucina") com **inteligência opcional** (o texto pode ficar melhor, não só mais bonito).

---

## 3. Público-alvo

Núcleo inicial: **estudantes de graduação e pós-graduação** (TCC, monografia, dissertação, tese, artigos, projetos de pesquisa, relatórios). Secundários: professores e orientadores que revisam trabalhos, e profissionais que produzem documentos técnicos com exigência de padronização. O modelo de assinatura combina especialmente com quem produz vários trabalhos ao longo do semestre/ano.

---

## 4. Escopo

### Dentro do escopo (MVP)
- Formatação completa de trabalho acadêmico conforme o pacote de normas ABNT vigente.
- Geração de elementos pré-textuais (capa, folha de rosto, sumário etc.) por modelo misto.
- Upload de template da instituição quando houver exigências específicas.
- Campo de regras customizadas (no MVP, mapeado para parâmetros configuráveis).
- Exportação em `.docx` (saída única do MVP).
- Autenticação e assinatura mensal.

### Fora do MVP (entra nas fases seguintes)
- Exportação em `.pdf`.
- Edição/correção e reescrita por IA.
- Inserção de citações e referências sugeridas pela IA (com verificação de fontes).
- Geração de partes faltantes (resumo, conclusão etc.).
- Aplicativos nativos iOS/Android.

### Limite honesto do "100% nas normas"
É importante separar dois níveis, porque eles têm garantias diferentes:

1. **Regras de formatação** (margens, fonte, espaçamento, recuo, numeração de páginas e seções, ordenação de referências): são totalmente determinísticas e **podem ser garantidas 100%**.
2. **Estruturação semântica** (identificar, num texto cru, o que é título de seção, o que é citação longa, onde começam as referências, qual o nível de cada seção): isso depende de **interpretar** o conteúdo. Em texto bem estruturado o acerto é alto; em texto bagunçado, há risco de erro de mapeamento.

Por isso a recomendação é: **garantir a conformidade da formatação** e, para a estruturação, usar um passo de detecção (heurísticas no MVP, IA depois) **+ uma tela de revisão/confirmação** antes da exportação. O marketing deve prometer "formatação ABNT garantida", não "interpretação perfeita de qualquer texto" — essa distinção protege a confiança no produto.

---

## 5. Normas ABNT cobertas

O "pacote" de um trabalho acadêmico completo envolve várias normas. As versões vigentes (jun/2026):

| Norma | Versão vigente | O que rege |
|---|---|---|
| NBR 14724 | **2024** (4ª ed.) | Apresentação de trabalhos acadêmicos (estrutura, margens, fonte, espaçamento, paginação) |
| NBR 10520 | **2023** (2ª ed.) | Citações em documentos (autor-data / numérico) |
| NBR 6023 | **2018** (errata 2020)* | Referências — elaboração |
| NBR 6024 | 2012 | Numeração progressiva das seções |
| NBR 6027 | 2012 | Sumário |
| NBR 6028 | 2021 | Resumo (e abstract) |
| NBR 6034 | 2004 | Índice |
| NBR 15287 | 2011 | Projeto de pesquisa |
| NBR 6022 | — | Artigo científico (se cobrir esse formato) |

\* **Atenção:** há divergência entre fontes sobre a versão atual da NBR 6023 (a maioria indica 2018/2020, mas algumas publicações recentes mencionam uma revisão de 2025). **Verificar sempre no catálogo oficial da ABNT** antes de fechar as regras.

### Mudanças recentes que o motor precisa incorporar
- **NBR 14724:2024** — trabalho organizado em **seções** (não "capítulos"); o verso da folha de rosto com ficha catalográfica **não é contado nem numerado**.
- **NBR 10520:2023** — autoria de pessoa física entre parênteses agora em **maiúsculas/minúsculas** (ex.: `(Silva, 2019, p. 1)`, não `(SILVA...)`); uso de **et al.** a partir de **4 autores**; não se usa mais ponto final entre conteúdo e citação; suporte a localizadores (`local.`) para e-books/documentos não paginados.

### Implicação de arquitetura: motor versionado
Como as normas mudam, o motor de formatação **não pode ter as regras "chumbadas" no código**. Cada norma deve ser uma **camada de regras versionada e atualizável** (ex.: perfil `ABNT-2024`), permitindo:
- atualizar uma norma sem reescrever o sistema;
- oferecer perfis institucionais (universidades que adaptam a ABNT);
- manter compatibilidade caso uma instituição ainda exija a versão antiga.

---

## 6. Arquitetura conceitual

A espinha dorsal do produto é a separação entre **o que é regra fixa** e **o que é interpretação**. Essa fronteira é o que dá confiabilidade.

```
                 ┌───────────────────────────────┐
   Texto cru  →  │  1. PARSER / ESTRUTURADOR      │  → modelo estruturado
   (.docx,       │  (detecta título, seções,      │     (título, seções,
    .txt,        │   citações, referências…)      │      citações, refs…)
    colado)      └───────────────────────────────┘
                                │
                                ▼
                 ┌───────────────────────────────┐
                 │  2. TELA DE REVISÃO/CONFIRMAÇÃO│  ← usuário ajusta o que
                 │  + formulário pré-textual      │     a detecção errou
                 │  + campo de regras customizadas│
                 └───────────────────────────────┘
                                │
                                ▼
                 ┌───────────────────────────────┐
                 │  3. MOTOR DETERMINÍSTICO ABNT  │  → regras de formatação
                 │  (perfil de normas versionado) │     aplicadas (100%)
                 └───────────────────────────────┘
                                │
                                ▼
                 ┌───────────────────────────────┐
                 │  4. EXPORTADOR  (.docx / .pdf) │  → documento final
                 └───────────────────────────────┘

   ── Camada de IA (fases 1+), sempre OPCIONAL e auditável ──
   • Correção ortográfica/gramatical
   • Reescrita (só com permissão do usuário)
   • Sugestão de citações/referências  →  PIPELINE DE VERIFICAÇÃO  →  confirmação do usuário
   • Geração de partes faltantes (resumo, conclusão…)
```

### Por que o motor de formatação deve ser determinístico — **inclusive na versão final**
Formatação é um problema de **regras**, não de geração: margem de 3 cm é 3 cm. Usar IA para aplicar layout introduz variabilidade e risco de erro justamente onde o produto promete garantia. Recomendação firme: **a formatação permanece determinística mesmo na versão final**; a IA atua sobre **conteúdo** (texto, citações, sugestões), nunca sobre as regras de layout. Isso mantém a promessa central intacta e torna o sistema testável (dá para escrever testes automatizados que verificam cada regra).

### O verdadeiro desafio de engenharia: o parser
O ponto difícil de "formatar qualquer texto, independente da qualidade" **não é** aplicar as regras — é **detectar a estrutura** num texto cru. Estratégia recomendada:
- **MVP:** heurísticas + regras (detecção por padrões: linhas curtas em caixa alta = título; blocos com 4+ linhas e aspas = citação longa; lista no fim com padrão `SOBRENOME, Nome` = referências). Onde a confiança for baixa, mandar para a tela de revisão.
- **Fase 1+:** IA assistindo a **detecção** (classificar cada bloco), mantendo a **aplicação** das regras determinística. A IA diz "isto é uma citação longa"; o motor decide como formatá-la.

---

## 7. Jornada do usuário (fluxo principal)

1. **Entrada:** usuário cola o texto ou envia um arquivo (`.docx`, `.txt`).
2. **Configuração:** escolhe o tipo de trabalho (TCC, artigo, dissertação…) e o perfil de norma; opcionalmente envia o template da instituição; preenche/confirma os dados pré-textuais (modelo misto: a IA pré-preenche o que conseguir extrair, o usuário completa); lista regras customizadas, se houver.
3. **Revisão da estrutura:** o sistema mostra como interpretou o documento (seções, citações, referências) para o usuário confirmar ou corrigir.
4. **(Opcional) Melhoria por IA:** o usuário ativa correção, reescrita, sugestão de citações/referências ou geração de partes faltantes. Cada sugestão é apresentada para aprovação.
5. **Geração:** o motor determinístico formata.
6. **Exportação:** download em `.docx` (MVP; `.pdf` em fase posterior).

---

## 8. Funcionalidades detalhadas

### 8.1 Formatação ABNT (núcleo, MVP)
Aplicação determinística de: margens (3 cm superior/esquerda, 2 cm inferior/direita), fonte (Times New Roman ou Arial 12), espaçamento 1,5 no corpo, recuo de parágrafo, citações longas com recuo de 4 cm e fonte menor, numeração progressiva de seções (NBR 6024), paginação correta (NBR 14724:2024, considerando a regra do verso da folha de rosto), sumário automático (NBR 6027), resumo/abstract (NBR 6028), citações (NBR 10520:2023) e referências em ordem alfabética (NBR 6023).

### 8.2 Elementos pré-textuais — modelo misto
A IA extrai do texto o que conseguir (título, autor, instituição…) e o usuário confirma/completa em formulário. Quando a instituição tiver exigências próprias de capa/folha de rosto, o usuário **envia o template** e o sistema o respeita como override.

### 8.3 Campo de regras customizadas
Espaço onde o usuário lista exigências específicas. Exemplos: "usar sistema numérico em vez de autor-data", "fonte Arial 12", "incluir epígrafe", "espaçamento simples nas notas". No MVP, mapeadas para **parâmetros configuráveis** do motor; nas fases seguintes, a IA **interpreta regras em texto livre** e as traduz em parâmetros (sempre validadas contra as normas, para não criar conflito).

### 8.4 Edição e enriquecimento por IA (fases 1+)
- **Correção** ortográfica e gramatical.
- **Reescrita** — somente quando o usuário autorizar, com visualização do antes/depois.
- **Sugestão de citações e referências** que agreguem ao texto — **com verificação obrigatória** (ver 8.5).
- **Geração de partes faltantes** (ex.: resumo a partir do corpo, conclusão a partir do desenvolvimento), sempre marcada como conteúdo gerado para revisão do usuário.

### 8.5 Verificação de fontes (anti-alucinação) — requisito crítico
Modelos de linguagem inventam referências que **parecem** reais mas não existem. Num produto acadêmico isso é inaceitável. Regra de ouro: **nenhuma citação ou referência sugerida pela IA entra no documento sem ser verificada e confirmada pelo usuário.**

Pipeline recomendado:
1. A IA propõe a citação/referência **com identificador resolvível** (DOI, ISBN, ou URL).
2. O sistema consulta uma base autoritativa — **CrossRef** (DOI), busca de ISBN, ou bases acadêmicas — para confirmar que a obra existe e bater os metadados (autores, título, ano, veículo).
3. Só fontes **confirmadas** são apresentadas ao usuário, com o link da verificação.
4. O usuário **aprova cada uma** antes da inserção.
5. A referência é então formatada deterministicamente pela NBR 6023.

Fontes não verificáveis são descartadas ou marcadas explicitamente como "não confirmada — inserir por sua conta e risco".

---

## 9. Saída

**No MVP, a saída é apenas `.docx`** — o que dispensa o binário do LibreOffice e permite rodar em serverless puro. A exportação `.pdf` entra em fase posterior; o restante desta seção descreve a estratégia de PDF para quando ele for implementado.

Recomendação para o PDF (fase posterior): **fonte única da verdade**. Gerar primeiro o documento estruturado (`.docx`) e **converter a partir dele** (ex.: LibreOffice headless), garantindo que as duas saídas sejam idênticas e evitando manter dois formatadores.

Alternativa de alta fidelidade para o PDF: a classe **abnTeX2** (LaTeX) é referência em conformidade ABNT e produz PDFs praticamente impecáveis — vale considerar se a fidelidade do PDF for diferencial de venda. O custo é manter um segundo caminho de geração e perder a editabilidade. Para o MVP, o caminho `.docx → PDF` é mais simples e suficiente.

---

## 10. Stack tecnológica recomendada

Pensada para reaproveitar o caminho web → mobile e a fluência em JS/React.

- **Frontend web (MVP):** Next.js (React) + Tailwind. SPA com tela de upload, configuração, revisão e export.
- **Mobile (versão final):** **Expo / React Native** num monorepo compartilhando lógica com a web — ou, para um caminho mais curto, empacotar a web com **Capacitor**. Expo é o investimento mais sólido para nativo de verdade.
- **Backend:** Node (coeso com o front em JS) ou Python. Para geração de `.docx`, `python-docx` é maduro; em Node, a lib `docx`. Para PDF: LibreOffice headless (conversão) e/ou abnTeX2.
- **Motor de regras ABNT:** módulo isolado, **versionado por norma** (perfis `ABNT-2024` etc.), com **suite de testes automatizados** validando cada regra — é isso que sustenta a promessa de conformidade.
- **IA (fases 1+):** modelo de linguagem para correção/reescrita/sugestão, sempre com a camada de verificação de fontes (CrossRef/ISBN) entre a sugestão e a inserção.
- **Infra:** autenticação, gestão de assinatura (ex.: Stripe), armazenamento seguro e temporário dos documentos.

---

## 11. Modelo de negócio

**Assinatura mensal.** Estrutura de planos sugerida (a calibrar):

- **Gratuito / trial:** 1 documento, ou com marca d'água, para o usuário experimentar a formatação.
- **Básico:** formatação ABNT ilimitada, exportação `.docx` (PDF quando disponível).
- **Pro:** tudo do Básico + edição por IA + sugestão de citações/referências verificadas + geração de partes faltantes.

A formatação determinística é barata de operar (bom para o caixa); os recursos de IA têm custo por uso e ficam no plano superior, ajudando a justificar o upgrade.

---

## 12. Riscos e mitigações

| Risco | Mitigação |
|---|---|
| IA alucina referências inexistentes | Pipeline de verificação (CrossRef/ISBN) + confirmação do usuário; nada entra sem fonte resolvível |
| Normas mudam | Motor de regras versionado e atualizável; processo de revisão quando a ABNT publica nova edição |
| Texto de entrada bagunçado quebra a estruturação | Passo de detecção + tela de revisão/confirmação antes de exportar |
| Promessa de "100%" gerar frustração | Prometer conformidade **de formatação**; deixar claro que a interpretação de estrutura é revisável |
| LGPD / privacidade | Trabalhos podem ser inéditos: não treinar modelos com dados do usuário, armazenar com segurança, oferecer exclusão e ser transparente no tratamento |
| Divergência de versão da norma (ex.: NBR 6023) | Confirmar no catálogo oficial da ABNT antes de fechar cada perfil de regras |

---

## 13. Roadmap por fases

- **Fase 0 — MVP web:** parser/estruturador + motor determinístico (perfil ABNT vigente) + formulário pré-textual + upload de template + campo de regras (parametrizado) + export `.docx` + auth + assinatura.
- **Fase 1 — Edição por IA + PDF:** exportação `.pdf`; correção ortográfica/gramatical, reescrita opcional, interpretação de regras customizadas em texto livre.
- **Fase 2 — Enriquecimento verificado:** sugestão de citações/referências com pipeline anti-alucinação; geração de partes faltantes.
- **Fase 3 — Mobile:** apps iOS e Android (Expo/monorepo ou Capacitor).

---

## 14. Próximos passos sugeridos

1. **Fechar o perfil de regras do MVP** consultando o catálogo oficial da ABNT (confirmar versões, em especial a NBR 6023) e transcrevendo cada regra de formatação para o motor.
2. **Prototipar o parser/estruturador** com um conjunto de textos reais "bagunçados" para medir a taxa de acerto da detecção — é o maior risco técnico.
3. **Validar a exportação `.docx`** com casos reais e checklist de conformidade (PDF é fase posterior).
4. **Desenhar a tela de revisão/confirmação**, que é o que torna "qualquer texto" viável sem quebrar a promessa de conformidade.
5. **Definir os planos e o gateway de assinatura.**

---

*Versões de norma citadas conforme vigência em jun/2026; confirmar sempre no catálogo oficial da ABNT antes de implementar.*
