import { AlignmentType, Paragraph, TextRun } from 'docx';
import type { Heading } from '../model/types';
import type { ResolvedRules } from '../rules/load';
import { applyCase } from './text-case';

export class SectionCounter {
  private counters = [0, 0, 0, 0, 0];
  next(level: 1|2|3|4|5): string {
    this.counters[level - 1]++;
    for (let i = level; i < 5; i++) this.counters[i] = 0;
    return this.counters.slice(0, level).join('.');
  }
}

export function buildHeading(h: Heading, counter: SectionCounter, rules: ResolvedRules): Paragraph {
  const number = counter.next(h.level);
  const style = rules.sections.titleStylesByLevel[h.level];
  const label = `${number} ${applyCase(h.text, style.case)}`; // separador: um espaço, sem pontuação
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    pageBreakBefore: h.level === 1,
    spacing: { line: rules.spacing.bodyLine, before: 0, after: 0 },
    children: [new TextRun({
      text: label, font: rules.fonts.family, size: rules.fonts.bodyHalfPt,
      color: rules.fonts.color, bold: style.bold, italics: style.italic,
    })],
  });
}
