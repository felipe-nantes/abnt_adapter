import {
  AlignmentType, Header, PageNumber, Paragraph, TextRun,
  type ISectionOptions, type FileChild,
} from 'docx';
import type { ResolvedRules } from '../rules/load';

export function buildSection(rules: ResolvedRules, children: FileChild[]): ISectionOptions {
  const pageNumberPar = new Paragraph({
    alignment: AlignmentType.RIGHT,
    children: [new TextRun({ children: [PageNumber.CURRENT], size: rules.fonts.smallHalfPt, font: rules.fonts.family })],
  });

  return {
    properties: {
      page: {
        size: { width: rules.page.widthTw, height: rules.page.heightTw },
        margin: {
          top: rules.page.margin.top,
          right: rules.page.margin.right,
          bottom: rules.page.margin.bottom,
          left: rules.page.margin.left,
          header: rules.page.headerTw,
        },
      },
    },
    headers: { default: new Header({ children: [pageNumberPar] }) },
    children,
  };
}
