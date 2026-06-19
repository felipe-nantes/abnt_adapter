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
