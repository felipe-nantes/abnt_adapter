import rawJson from '../../config/abnt-2024.rules.json'; // Vitest/Vite resolve JSON; tsconfig resolveJsonModule
import { rulesJsonSchema } from './schema';
import { cmToTw, ptToHalfPt, spacingToLine } from './units';

export type TitleStyle = { case: 'uppercase'|'title'|'sentence'; bold: boolean; italic: boolean };
export type ResolvedRules = {
  page: { widthTw: number; heightTw: number; headerTw: number;
          margin: { top: number; right: number; bottom: number; left: number } };
  fonts: { family: string; color: string; bodyHalfPt: number; smallHalfPt: number };
  spacing: { bodyLine: number; singleLine: number };
  paragraph: { firstLineIndentTw: number };
  sections: { titleStylesByLevel: Record<1|2|3|4|5, TitleStyle> };
  citations: { system: 'author-date'|'numeric'; longIndentTw: number; etAlFrom: number };
  unnumberedTitles: { case: 'uppercase'; bold: boolean };
};

export function loadRules(profile: 'abnt-2024'): ResolvedRules {
  if (profile !== 'abnt-2024') throw new Error(`perfil desconhecido: ${profile}`);
  const j = rulesJsonSchema.parse(rawJson);
  const styles = j.sections.titleStylesByLevel as Record<string, TitleStyle>;
  return {
    page: {
      widthTw: cmToTw(j.page.widthCm),
      heightTw: cmToTw(j.page.heightCm),
      headerTw: cmToTw((j.pagination as any).distanceFromTopCm),
      margin: {
        top: cmToTw(j.page.margins.top),
        right: cmToTw(j.page.margins.right),
        bottom: cmToTw(j.page.margins.bottom),
        left: cmToTw(j.page.margins.left),
      },
    },
    fonts: {
      family: j.fonts.defaultFamily,
      color: j.fonts.color.replace('#', ''),
      bodyHalfPt: ptToHalfPt(j.fonts.sizesPt.body),
      smallHalfPt: ptToHalfPt(j.fonts.sizesPt.longCitation),
    },
    spacing: { bodyLine: spacingToLine(j.spacing.body), singleLine: spacingToLine(j.spacing.single) },
    paragraph: { firstLineIndentTw: cmToTw(j.paragraph.firstLineIndentCm) },
    sections: {
      titleStylesByLevel: {
        1: styles['1'], 2: styles['2'], 3: styles['3'], 4: styles['4'], 5: styles['5'],
      },
    },
    citations: {
      system: j.citations.system,
      longIndentTw: cmToTw(j.citations.long.leftIndentCm),
      etAlFrom: j.citations.authorDateFormat.etAlFromAuthors,
    },
    unnumberedTitles: { case: 'uppercase', bold: true },
  };
}
