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
