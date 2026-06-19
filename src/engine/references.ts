import { AlignmentType, Paragraph, TextRun } from 'docx';
import type { Reference } from '../model/types';
import type { ResolvedRules } from '../rules/load';
import { buildRuns } from './paragraph';
import { applyCase } from './text-case';

export function buildReferences(refs: Reference[], rules: ResolvedRules): Paragraph[] {
  const title = new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { line: rules.spacing.bodyLine, before: 0, after: 0 },
    children: [new TextRun({
      text: applyCase('Referências', rules.unnumberedTitles.case),
      font: rules.fonts.family, size: rules.fonts.bodyHalfPt,
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
