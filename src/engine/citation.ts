import { AlignmentType, Paragraph, TextRun } from 'docx';
import type { CitationRef, LongCitation } from '../model/types';
import type { ResolvedRules } from '../rules/load';

// Fragmento de uma citação autor-data; `italic` marca o "et al." (NBR 10520:2023).
export type CitationRunSpec = { text: string; italic?: boolean };

// Maiúsc/minúsc (NBR 10520:2023): só primeira letra maiúscula por sobrenome.
const toTitle = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

export function buildCitationRuns(ref: CitationRef, rules: ResolvedRules): CitationRunSpec[] {
  const authors = ref.authors.map(toTitle);
  const locator = ref.page ? `, p. ${ref.page}` : ref.location ? `, local. ${ref.location}` : '';

  if (authors.length >= rules.citations.etAlFrom) {
    // "et al." sai num run separado para poder ser itálico conforme a norma.
    return [
      { text: `(${authors[0]} ` },
      { text: 'et al.', italic: rules.citations.etAlItalic },
      { text: `, ${ref.year}${locator})` },
    ];
  }
  return [{ text: `(${authors.join('; ')}, ${ref.year}${locator})` }];
}

export function buildLongCitation(block: LongCitation, rules: ResolvedRules): Paragraph {
  const small = rules.fonts.smallHalfPt;
  const citationRuns = buildCitationRuns(block.citation, rules).map(
    (s) => new TextRun({ text: s.text, italics: s.italic, font: rules.fonts.family, size: small, color: rules.fonts.color }),
  );
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    indent: { left: rules.citations.longIndentTw },
    spacing: { line: rules.spacing.singleLine, before: 0, after: 0 },
    children: [
      new TextRun({ text: `${block.text} `, font: rules.fonts.family, size: small, color: rules.fonts.color }),
      ...citationRuns,
    ],
  });
}
