import { AlignmentType, Paragraph, TextRun } from 'docx';
import type { CitationRef, LongCitation } from '../model/types';
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
