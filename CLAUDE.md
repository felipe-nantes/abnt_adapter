# CLAUDE.md — Formatador ABNT (MVP)

> Guia de DX para trabalhar neste repositório. **Não é** a fonte das regras ABNT.
> A fonte única da verdade das regras é `config/abnt-2024.rules.json` (camada de enforcement).
> Detalhes e critérios de aceite: `docs/REGRAS_MVP_ABNT.md`.

## O que é
Sistema que recebe texto cru (acadêmico) e devolve `.docx` formatado na ABNT (perfil ABNT-2024). Saída `.pdf` é fase posterior.
MVP é web; formatação 100% determinística; IA entra em fases posteriores.

## Princípio inegociável
**Formatação é regra, não geração.** O motor lê o perfil JSON e aplica. Nunca usar IA para aplicar layout.
Mudou uma regra? Edita-se o **JSON**, não o código nem este arquivo.

## Restrição de custo (MVP sem API)
**O MVP roda 100% sem nenhuma API paga nem LLM** — custo de operação ~zero para iniciar.
- Sem chamada a IA em qualquer etapa do MVP: formatação determinística, estruturação por heurística (regex), pré-textuais por formulário manual + pré-preenchimento regex.
- Se uma feature do MVP exigir API externa ou LLM, **ela não é do MVP** → mover para fase posterior.
- Custos de API (correção/reescrita, sugestão de citações, extração por IA) só nas fases pagas.

## Arquitetura (pipeline)
1. **Parser/estruturador** → texto cru vira modelo estruturado (título, seções+nível, citações, referências).
2. **Tela de revisão** → usuário confirma/corrige a detecção + dados pré-textuais + overrides.
3. **Motor determinístico** → aplica `abnt-2024.rules.json` ao modelo.
4. **Exportador** → `.docx` (única saída do MVP). Exportação `.pdf` fica para fase posterior.

## Stack (open source, sem licença/sem API no MVP)
- Frontend: Next.js + Tailwind (cabe em free tier, ex.: Vercel).
- Geração `.docx`: lib `docx` (Node). **Saída do MVP é só `.docx`** → sem binário, roda em serverless puro.
- Exportação `.pdf`: **fase posterior** (provável LibreOffice headless ou abnTeX2; exige binário/container, por isso fica fora do MVP).
- Pagamento: Stripe (sem custo fixo; só % por transação). Auth: open source ou free tier.
- Rules: JSON versionado por perfil em `config/`.
- Testes: Vitest/Jest abrindo o `.docx` gerado e validando propriedades contra o checklist da spec.

## Estrutura sugerida
```
config/abnt-2024.rules.json     # enforcement layer (fonte da verdade)
src/parser/                     # detecção de estrutura (heurísticas no MVP)
src/engine/                     # motor: aplica o perfil ao modelo
src/exporter/                   # docx (pdf em fase posterior)
src/review/                     # tela de revisão/confirmação
docs/REGRAS_MVP_ABNT.md         # spec + critérios de aceite
tests/                          # 1 teste por item do checklist
```

## Unidades (ao gerar .docx)
1 cm ≈ 566,93 twips · fonte em half-points (12 pt → `size: 24`) · entrelinha `line`: 240 = 1,0 / 360 = 1,5.

## Ordem de construção (MVP)
1. Motor + exportador `.docx` lendo o JSON, com **fixtures** de modelo já estruturado (sem parser). Fechar todos os testes de formatação primeiro.
2. Parser/estruturador + tela de revisão.
3. Formulário pré-textual (manual + pré-preenchimento regex, **sem LLM**) + upload de template + overrides.
4. Auth + assinatura.

_(Fase posterior: exportação `.pdf`.)_

## Regras de trabalho
- Toda regra de formatação sai do JSON. Se algo não está no JSON, **pare e pergunte** antes de codar valor.
- Não promover "interpretação perfeita de qualquer texto": estruturação incerta vai para a tela de revisão.
- Citações/referências geradas por IA são fase posterior e **exigem verificação de fonte** — não implementar inserção automática agora.
- `et al.` só a partir de 4 autores; autoria entre parênteses em Maiúsc/minúsc (NBR 10520:2023).
- Edições de `.docx` no código por mutação direta; evitar saída verbosa no chat.

## Aviso de norma
Versões em `norms` do JSON valem para jun/2026. **Confirmar a NBR 6023 no catálogo oficial** antes de fechar o perfil.
